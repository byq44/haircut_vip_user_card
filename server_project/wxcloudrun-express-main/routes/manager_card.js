const express = require("express");
const {sequelize} = require("../db");
const { QueryTypes } = require("sequelize");
const resultEnum = require("../result_enum")

const router = express.Router();

// 管理员查询现有的会员卡和充值信息 类型
router.get("/api/getCardMethod", async (req, res) => {
    try {
      const results = await sequelize.query(
        "SELECT * FROM vip_card_method order by method_id desc", 
        {
          type: QueryTypes.SELECT
        }
      );
      res.send({
        result: resultEnum.success,
        data: results,
      });
       
    } catch (err) {
      console.log(err)
      res.send({
        result: resultEnum.failed
      })
    }
});

// 增加卡类型
router.post("/api/addCardMethod", async (req, res) => {
  try {
      var metadata = []
      if (req.body.isDiscount) {
        if (/^\d+$/.test(req.body.totalAmount) && /^[1-9]\d+$/.test(req.body.discount)) {
          metadata = await sequelize.query(
            'insert into vip_card_method (method_id, name, total_amount, type, discount) values(?, ?, ?, 1, ?)', {
            type: QueryTypes.INSERT,
            replacements: [req.body.methodId, req.body.name, req.body.totalAmount, req.body.discount] // 绑定查询参数
          });
        }
      }else {
        if (/^\d+$/.test(req.body.totalAmount)) {
          metadata = await sequelize.query(
            'insert into vip_card_method (method_id, name, total_amount, type) values(?, ?, ?, 0)', {
            type: QueryTypes.INSERT,
            replacements: [req.body.methodId, req.body.name, req.body.totalAmount] // 绑定查询参数
          });
        }
      }

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

// 删除卡类型
router.post("/api/deleteCardMethod", async (req, res) => {
  try {
    // 只能删除没有消费过的卡类目
    var metadata = []
    metadata = await sequelize.query(
      'select card_id from expense_record where card_id in (SELECT card_id FROM vip_user_card where method_id = ?) limit 1', {
      type: QueryTypes.SELECT,
      replacements: [req.body.methodId] // 绑定查询参数
    });

    if (metadata.length == 0) {
      // 先删除卡类目(INSERT类可返回影响行数，delete不返回)
      metadata = await sequelize.query(
        'delete from vip_card_method where method_id = ?', {
        type: QueryTypes.INSERT,
        replacements: [req.body.methodId] // 绑定查询参数
      });
      
      if(metadata[1] == 1) {
        // 删除可能建立过的会员卡
        await sequelize.query(
        'delete from vip_user_card where method_id = ?', {
        type: QueryTypes.INSERT,
        replacements: [req.body.methodId] // 绑定查询参数
        });

        // 删除卡类目成功，返回全部卡类型刷新页面
        metadata = await sequelize.query(
          "SELECT * FROM vip_card_method order by method_id desc", 
          {
            type: QueryTypes.SELECT
          }
        );
        res.send({
          result: resultEnum.success,
          metadata: metadata
        });
      } else {
        res.send({
          result: resultEnum.failed
        })
      }
    } else {
      // 该卡类型在用户中已开通使用
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

// 查询 项目类型
router.get("/api/getProjectInfo", async (req, res) => {
  try {
    const results = await sequelize.query(
      "select * from expense_project where project_id != 1 order by project_id desc", 
      {
        type: QueryTypes.SELECT
      }
    );
    res.send({
      result: resultEnum.success,
      data: results,
    });
     
  } catch (err) {
    console.log(err)
    res.send({
      result: resultEnum.failed
    })
  }
});

// 增加项目类型
router.post("/api/addProject", async (req, res) => {
  try {
    var metadata = []
    if (/^\d+(.\d{1,2})?$/.test(req.body.price)) {
      metadata = await sequelize.query(
        'insert into expense_project (project_name, project_price) values(?,?)', {
        type: QueryTypes.INSERT,
        replacements: [req.body.name, req.body.price] // 绑定查询参数
      });
    }
    if(metadata[1] == 1) {
      // 添加成功则直接返回全部项目刷新页面
      metadata = await sequelize.query(
        "select * from expense_project where project_id != 1 order by project_id desc", 
        {
          type: QueryTypes.SELECT
        }
      );
      
      res.send({
        result: resultEnum.success,
        data: metadata
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

// 删除项目
router.post("/api/deleteProject", async (req, res) => {
  try {
    // 如果该项目在消费记录中存在，则无法删除
    var metadata = []
    metadata = await sequelize.query(
      'SELECT card_id FROM expense_record where expense_project_id = ? limit 1', {
      type: QueryTypes.SELECT,
      replacements: [req.body.projectId] // 绑定查询参数
    });

    if (metadata.length == 0) {
      metadata = await sequelize.query(
        'delete from expense_project where project_id = ?', {
        type: QueryTypes.INSERT,
        replacements: [req.body.projectId] // 绑定查询参数
      });
      if(metadata[1] == 1) {
        // 删除成功则直接返回全部卡类型刷新页面
        metadata = await sequelize.query(
          "select * from expense_project where project_id != 1 order by project_id desc", 
          {
            type: QueryTypes.SELECT
          }
        );
        res.send({
          result: resultEnum.success,
          metadata: metadata
        });
      } else {
        res.send({
          result: resultEnum.failed
        })
      }
    } else {
      // 该项目在消费记录中存在
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

module.exports = router;