const express = require("express");
const {sequelize} = require("../db");
const { QueryTypes } = require("sequelize");
const resultEnum = require("../result_enum")

const router = express.Router();

// 查询手机号的会员卡和充值信息
router.get("/api/getVipCardInfo", async (req, res) => {
    try {
      const results = await sequelize.query(
        "SELECT card_id,name,total_amount, remainder_amount,type,discount FROM vip_user_card,vip_card_method WHERE user_phone = ? and vip_user_card.method_id = vip_card_method.method_id ORDER BY card_id desc", 
        {
          replacements: [req.query.phone],
          type: QueryTypes.SELECT
        }
      );
      res.send({
        result: resultEnum.success,
        data: results
      });
      
    } catch (err) {
      console.log(err)
      res.send({
        result: resultEnum.failed
      })
    }
  });

// 查询手机号的消费记录
router.get("/api/getPhoneExpenseRecord", async (req, res) => {
  try {
    var results = []
    if (req.query.cardId == 'undefined') {
      results = await sequelize.query(
        "select vip_user_card.card_id, name, total_amount, type, discount, expense_amount, expense_time, project_name, project_price from vip_user_card, vip_card_method, expense_record, expense_project where user_phone = ? and vip_user_card.method_id = vip_card_method.method_id and vip_user_card.card_id = expense_record.card_id and expense_record.expense_project_id = expense_project.project_id", 
        {
          replacements: [req.query.phone],
          type: QueryTypes.SELECT
        }
      );
    } else {
      results = await sequelize.query(
        "select vip_user_card.card_id, name, total_amount, remainder_amount, type, discount, expense_amount, expense_time, project_name, project_price from vip_user_card, vip_card_method, expense_record, expense_project where vip_user_card.card_id = ? and vip_user_card.method_id = vip_card_method.method_id and vip_user_card.card_id = expense_record.card_id and expense_record.expense_project_id = expense_project.project_id", 
        {
          replacements: [req.query.cardId],
          type: QueryTypes.SELECT
        }
      );
    }
    res.send({
      result: resultEnum.success,
      data: results
    });
    
     
  } catch (err) {
    console.log(err)
    res.send({
      result: resultEnum.failed
    })
  }
});

// 管理员进行会员充值
router.post("/api/vipPruchase", async (req, res) => {
  try {

    // 不可充值已存在管理员账号
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

    // 先判断用户表中有无此手机号，如果没有则需插入手机号到用户表
    const results_vipuser = await sequelize.query(
      "SELECT user_phone,user_notes FROM vip_user where user_phone = ?", 
      {
        replacements: [req.body.phone],
        type: QueryTypes.SELECT
      }
    );
    var metadataPhone = []
    if (results_vipuser.length == 0) {
      // 无号的情况，需要先新增用户
      metadataPhone = await sequelize.query(
        'insert into vip_user (user_phone,user_notes) VALUES (?,?)', {
        type: QueryTypes.INSERT,
        replacements: [req.body.phone, req.body.notes] // 绑定查询参数
      });

      if (metadataPhone[1] < 1) {
        res.send({
          result: resultEnum.failed
        })
        return
      }
    }

    // 新增卡
    const metadata = await sequelize.query(
      'insert into vip_user_card (method_id, user_phone, remainder_amount) values(?,?,(select total_amount from vip_card_method where method_id = ?))', {
      type: QueryTypes.INSERT,
      replacements: [req.body.methodId, req.body.phone, req.body.methodId] // 绑定查询参数
    });

    // 新增用户情况，返回传入的备注,否则返回查询到的用户备注
    if(metadata[1] == 1) {
      if (results_vipuser.length == 0) {
        res.send({
          result: resultEnum.success,
          notes: req.body.notes
        })
      } else {
        res.send({
          result: resultEnum.success,
          notes: results_vipuser[0].user_notes
        })
      }

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

// 管理员进行会员消费
router.post("/api/vipExpense", async (req, res) => {
  try {
    // 数据校验
    // 1.查询卡余额、折扣、项目价格
    const calculateInfo = await sequelize.query(
      "SELECT remainder_amount, discount, project_price FROM vip_user_card,expense_project,vip_card_method where vip_user_card.card_id = ? and vip_user_card.method_id = vip_card_method.method_id and expense_project.project_id = ?", 
      {
        replacements: [req.body.cardid, req.body.expenseprojectid],
        type: QueryTypes.SELECT
      }
    );
    
    // 2.计算花销
     var expense_amount = 0
    if (req.body.expenseprojectid == 1) {
      // 次卡情况
      if (Number(req.body.expenseamount) > 0 && /^\d+$/.test(req.body.expenseamount)) {
        expense_amount = req.body.expenseamount
      }
    } else {
      // 充值消费项目情况 
      expense_amount = `${calculateInfo[0].project_price * calculateInfo[0].discount * 0.01}`
      if (expense_amount.includes('.')) {
        expense_amount = expense_amount.substring(0, expense_amount.indexOf('.') + 3);
      }
    }

    if (Number(expense_amount) > 0) {
      // 3.若计算扣除花销后的余额小于 0, 则返回余额不足
      const newExp = calculateRemainder(calculateInfo[0].remainder_amount, expense_amount)
      if (newExp < 0) {
        res.send({
          result: resultEnum.notEnough
        })
      } else {
        // 4.大于0，则插入数据，先插入 消费记录表
        var metadata = await sequelize.query(
          'insert into expense_record (card_id, expense_amount, expense_time, expense_project_id) values(?,?,?,?)', {
          type: QueryTypes.INSERT,
          replacements: [req.body.cardid, expense_amount, new Date(), req.body.expenseprojectid] // 绑定查询参数
        });

        // 更新用户会员卡表
        if(metadata[1] == 1) {
          metadata = await sequelize.query(
            'update vip_user_card set remainder_amount = ? where card_id = ?', {
            type: QueryTypes.INSERT,
            replacements: [newExp, req.body.cardid] // 绑定查询参数
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
          res.send({
            result: resultEnum.failed
          })
        }
        
      }
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

function calculateRemainder(remainder, expense) {
  remainder = `${remainder}`
  expense = `${expense}`
   const powRemainder = remainder.includes('.') ? 
   remainder.split('.')[1].length == 2 ? 0 : 1
   : 2
   const powExpense = expense.includes('.') ? 
   expense.split('.')[1].length == 2 ? 0 : 1
   : 2
   if (powRemainder == 2 && powExpense == 2) {
     return remainder - expense
   } else {
    return ((remainder.replace(".","")) * Math.pow(10, powRemainder) - (expense.replace(".","")) * Math.pow(10, powExpense)) / 100
   }
 }


module.exports = router;