//欠费统计（年度）
var express = require('express');
var router = express.Router();
const superagent = require('superagent');
const cheerio = require('cheerio');
const request=require('request');
var getLoginCookie = require('../public/javascripts/getLoginCookie');
const url= require('../public/javascripts/config').url;
var session = require('express-session');

var browserMsg={
    "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36",
    'Content-Type':'application/x-www-form-urlencoded'
};

//设置
function getData(cookie) {
    return new Promise(function(resolve, reject) {
        //传入cookie
        superagent.post(url+'/ISVPay/PayQuery?start=2017-10-26&end=2018-10-26').set("Cookie",cookie).set(browserMsg).end(function(err,res) {
            if(err){
                console.log("error exception occured !");
                return next(error);
            }else {
                var $=$=cheerio.load(res.text);
                var attr={
                    payChannel:{
                        totleNum:0,
                        totleAmount:0,
                        datas:[
                            {
                                name:'支付宝（扫码）',
                                payNum:0,
                                payAmount:0
                            },
                            {
                                name:'支付宝',
                                payNum:0,
                                payAmount:0
                            },
                            {
                                name:'微信（扫码）',
                                payNum:0,
                                payAmount:0
                            },
                            {
                                name:'微信',
                                payNum:0,
                                payAmount:0
                            },
                            {
                                name:'市名卡',
                                payNum:0,
                                payAmount:0
                            },
                            {
                                name:'社保',
                                payNum:0,
                                payAmount:0
                            }
                        ]
                    }
                };
                //支付途径统计在第一个表格里
                var tableTr=$('table').eq(0).find('tr');
                //支付宝
                attr.payChannel.datas[0].payNum=Number(tableTr.eq(1).find('td').eq(2).text());
                attr.payChannel.datas[0].payAmount=Number(tableTr.eq(1).find('td').eq(3).text());
                attr.payChannel.datas[1].payNum=Number(tableTr.eq(4).find('td').eq(1).text());
                attr.payChannel.datas[1].payAmount=Number(tableTr.eq(4).find('td').eq(2).text());
                //微信
                attr.payChannel.datas[2].payNum=Number(tableTr.eq(2).find('td').eq(1).text());
                attr.payChannel.datas[2].payAmount=Number(tableTr.eq(2).find('td').eq(2).text());
                attr.payChannel.datas[3].payNum=Number(tableTr.eq(5).find('td').eq(1).text());
                attr.payChannel.datas[3].payAmount=Number(tableTr.eq(5).find('td').eq(2).text());
                //市名卡
                attr.payChannel.datas[4].payNum=Number(tableTr.eq(3).find('td').eq(2).text());
                attr.payChannel.datas[4].payAmount=Number(tableTr.eq(3).find('td').eq(3).text());
                //其他，社保等

                if(tableTr.eq(7)){
                    attr.payChannel.datas[5].payNum=Number(tableTr.eq(6).find('td').eq(1).text())+Number(tableTr.eq(7).find('td').eq(1).text());
                    attr.payChannel.datas[5].payAmount=Number(tableTr.eq(6).find('td').eq(2).text());
                }
                attr.payChannel.totleNum=Number(tableTr.eq(8).find('td').eq(2).text());
                attr.payChannel.totleAmount=Number(tableTr.eq(8).find('td').eq(3).text());
                var attr2=[];
                $('table').eq(1).find('tr').each(function (i,trItem) {
                    if(i>=1){
                        var tdItem=$(trItem).find('td');
                       attr2.push({'orgName':tdItem.eq(0).text(),'payNum':tdItem.eq(1).text(),'thirdPay':tdItem.eq(2).text(),'sbPay':tdItem.eq(3).text(),'totlePay':tdItem.eq(4).text()})
                    }

                });
                resolve({
                    'payChannel': attr.payChannel,
                    'hosChannel':attr2
                });
            }
        });
    });
}

router.get("/",function(req,resp){
    if(req.session && req.session.cookieData){
        getData(req.session.cookieData).then(function (data) {
            resp.send(data)
        });
    }else {
        getLoginCookie('黄军平', 'HJPmain').then(function (cookie) {
            req.session.cookieData=cookie;
            getData(cookie).then(function (data) {
                resp.send(data)
            });
        });
    }

});


module.exports = router;
