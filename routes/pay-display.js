/*实时就诊信息*/
var express = require('express');
var router = express.Router();
const superagent = require('superagent');
const cheerio = require('cheerio');
const request=require('request');
var getLoginCookie = require('../public/javascripts/getLoginCookie');
const url= require('../public/javascripts/config').url;
var session = require('express-session');

// 浏览器请求报文头部部分信息
var browserMsg={
    "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36",
    'Content-Type':'application/x-www-form-urlencoded'
};

//设置
function getData(cookie) {
    var reDate={};
    var jkdady=1;
    return new Promise(function(resolve, reject) {
        //传入cookie
        superagent.post(url+'/ReportChat/AreaTreatment').set("Cookie",cookie).set(browserMsg).send({
            'cmd': 'paycount',
            'type': 'day'
        }).end(function(err,res) {
            if(!res){
                console.log('请求富阳平台失败')
            }else {
                var datas = JSON.parse(res.text).Info;
                resolve({
                    'cookie': cookie,
                    'doc': datas
                });
            }

        });
    });
}


router.get("/",function(req,resp){
    if(req.session && req.session.cookieData){
        getData(req.session.cookieData).then(function (data) {
            var datas=JSON.parse(data.doc);
            var params={ 'zfb': datas.alipay, 'weixin': datas.wxpay, 'yinlian': datas.unpay, 'weimai': datas.wmpay, 'smkzh': datas.smkpay };
            resp.send(params)
        });
    }else {
        getLoginCookie('黄军平', 'HJPmain').then(function (cookie) {
            req.session.cookieData=cookie;
            getData(cookie).then(function (data) {
                var datas=JSON.parse(data.doc);
                var params={ 'zfb': datas.alipay, 'weixin': datas.wxpay, 'yinlian': datas.unpay, 'weimai': datas.wmpay, 'smkzh': datas.smkpay };
                resp.send(params)
            });
        });
    }

});


module.exports = router;
