const express = require("express");
const {sequelize} = require("../db");
const { QueryTypes } = require("sequelize");
const resultEnum = require("../result_enum")

const router = express.Router();

// 查询用户是否注册，只能是手机号和昵称、openid都有，或都没有的情况
router.get("/api/query_user", async (req, res) => {
  try {
    const user_openid = req.headers["x-wx-openid"]

    const results_manager = await sequelize.query(
      "SELECT user_phone FROM manager_user WHERE user_openid = ?",
      {
        replacements: [user_openid],
        type: QueryTypes.SELECT
      }
    );

    if (results_manager.length == 0) {

      const results_normal = await sequelize.query(
        "SELECT user_phone FROM vip_user WHERE user_openid = ?", 
        {
          replacements: [user_openid],
          type: QueryTypes.SELECT
        }
      );
  
      if (results_normal.length == 0) {
        res.send({
          result: resultEnum.empty
        })
      }else {
        res.send({
          result: resultEnum.success,
          phone: results_normal[0].user_phone
        });
      }

    } else {
      // 店长
      res.send({
        result: resultEnum.manager_login
      })
    }

  } catch (err) {
    console.log(err)
    res.send({
      result: resultEnum.failed
    })
  }
});

// 绑定vip用户手机号
router.post("/api/bind_user", async (req, res) => {
  try {
    const user_openid = req.headers["x-wx-openid"]

    // 不可绑定已存在管理员账号
    const results_manager = await sequelize.query(
      "SELECT user_phone FROM manager_user WHERE user_phone = ?",
      {
        replacements: [req.body.phone],
        type: QueryTypes.SELECT
      }
    );
    if (results_manager.length != 0) {
      res.send({
        result: resultEnum.not_allowed_manager_phone
      })
      return
    }

    // 判断手机号是否存在用户表，若存在，则可能被绑定过，也可能是管理员先进行了充值此时用户表openid为空
    // 若不存在，则一定未被绑定过
    const results_vipuser = await sequelize.query(
      "SELECT user_phone, user_openid FROM vip_user where user_phone = ?", 
      {
        replacements: [req.body.phone],
        type: QueryTypes.SELECT
      }
    );

    if (results_vipuser.length == 0) {
      // 不存在不添加会员信息
      res.send({
        result: resultEnum.empty
      })
    } else if(results_vipuser[0].user_phone == req.body.phone && results_vipuser[0].user_openid == '') {
      // 管理员先进行了充值情况，此时更新该手机号的openid
      const metadata = await sequelize.query(
        'update vip_user set user_openid = ? where user_phone = ?', {
        type: QueryTypes.UPDATE,
        replacements: [user_openid, req.body.phone] // 绑定查询参数
      });
      if(metadata[1] == 1) {
        res.send({
          result: resultEnum.success
        });
      } else {
        res.send({
          result: resultEnum.failed
        })
      }

    } else {
      // 插入重复手机号，不存在有openid却无phone的情况，因为店主才能插入，此时一定有phone
      res.send({
        result: resultEnum.bound
      })
    }

  } catch (err) {
      console.log(err)
      res.send({
        result: resultEnum.failed
      })
  }
});

// 管理员更改用户手机号
router.post("/api/vip_change", async (req, res) => {
  try {

    // 不可更改为已存在管理员账号
    const results_manager = await sequelize.query(
      "SELECT user_phone FROM manager_user WHERE user_phone = ?",
      {
        replacements: [req.body.newphone],
        type: QueryTypes.SELECT
      }
    );
    if (results_manager.length != 0) {
      res.send({
        result: resultEnum.not_allowed_manager_phone
      })
      return
    }

    // 判断 新手机号是否存在用户表，若存在，则一定被别人绑定，若不存在，则一定未被绑定过
    const results_vipuser_new = await sequelize.query(
      "SELECT user_phone FROM vip_user where user_phone = ?", 
      {
        replacements: [req.body.newphone],
        type: QueryTypes.SELECT
      }
    );
    // 用户表不存在新手机号
    if (results_vipuser_new.length == 0) {
      // 更新vip_user手机号，与vip_user_card手机号
      const metadata_user = await sequelize.query(
        "update vip_user set user_phone = ? where user_phone = ?", {
        type: QueryTypes.UPDATE,
        replacements: [req.body.newphone, req.body.oldphone] // 绑定查询参数
      });
      await sequelize.query(
        "update vip_user_card set user_phone = ? where user_phone = ?", {
        type: QueryTypes.UPDATE,
        replacements: [req.body.newphone, req.body.oldphone] // 绑定查询参数
      });
      if(metadata_user[1] > 0) {
        res.send({
          result: resultEnum.success
        });
      } else {
        res.send({
          result: resultEnum.failed
        })
      }
    } else {
      // 插入重复手机号
      res.send({
        result: resultEnum.bound
      })
    }

  } catch (err) {
      console.log(err)
      res.send({
        result: resultEnum.failed
      })
  }
});


// 管理员进行会员查询，返回手机号和用户备注
router.get("/api/vip_search", async (req, res) => {
  try {
    var results = []
    if (!req.query.phone && !req.query.note) {
      results = await sequelize.query(
        "SELECT user_phone, user_notes FROM vip_user", 
        {
          type: QueryTypes.SELECT
        }
      );
    } else if (req.query.phone && !req.query.note){
      results = await sequelize.query(
        "SELECT user_phone, user_notes FROM vip_user where user_phone like :phone", 
        {
          replacements: {phone: '%' + req.query.phone + '%'},
          type: QueryTypes.SELECT
        }
      );
    } else if (!req.query.phone && req.query.note) {
      results = await sequelize.query(
        "SELECT user_phone, user_notes FROM vip_user where user_notes like :note", 
        {
          replacements: {note: '%' + req.query.note + '%'},
          type: QueryTypes.SELECT
        }
      );
    } else {
      results = await sequelize.query(
        "SELECT user_phone, user_notes FROM vip_user where user_phone like :phone and user_notes like :note", 
        {
          replacements: {phone: '%' + req.query.phone + '%', note: '%' + req.query.note + '%'},
          type: QueryTypes.SELECT
        }
      );
    }
    res.send({
      result: resultEnum.success,
      data: results,
    })
    
  } catch (err) {
    console.log(err)
    res.send({
      result: resultEnum.failed
    })
  }
});


// 管理员修改用户备注
router.post("/api/alter_vip_note", async (req, res) => {
  try {
    const metadata = await sequelize.query(
      'update vip_user set user_notes = ? where user_phone = ?', {
      type: QueryTypes.UPDATE,
      replacements: [req.body.notes, req.body.phone] // 绑定查询参数
    });
    if(metadata[1] == 1) { 
      res.send({
        result: resultEnum.success
      });
    } else {
      res.send({
        result: resultEnum.failed
      })
    }

  } catch (err) {
      console.log(err)
      res.send({
        result: resultEnum.failed
      })
  }
});

module.exports = router;