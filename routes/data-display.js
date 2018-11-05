/*实时数据展示*/
var express = require('express');
var router = express.Router();
const superagent = require('superagent');
const cheerio = require('cheerio');
const request=require('request');
var getLoginCookie = require('../public/javascripts/getLoginCookie');
const url= require('../public/javascripts/config').url;
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
            'cmd': 'hostitalsum',
            'type': 'day'
        }).end(function(err,res) {//健康档案调阅
            var datas = JSON.parse(res.text).Info;
            superagent.post(url+'/Report/InvokePHRAnalysis').set("Cookie",cookie).set(browserMsg).send({
                'startdate': '2018-10-23',
                'enddate': '2018-10-23',
                'zzjgdm':'',
                'excel': false
            }).end(function(err,res) {
                jkdady=JSON.parse(JSON.parse(res.text).Info);
                resolve({
                    'cookie': cookie,
                    'doc': datas,
                    'jkdady':jkdady
                });
            });
        });
    });
}


router.get("/",function(req,resp){
    if(req.session && req.session.cookieData){
        getData(req.session.cookieData).then(function (data) {
            var datas=JSON.parse(data.doc);
            var reDate={ 'ydzf': datas.ydzfrc, 'sxzz': datas.sxzj, 'rydj': datas.zyrc, 'yygh': datas.yyghrc, 'mzjz': datas.mzjzrc,'jkdady':data.jkdady.invokephrnum};
            resp.send(reDate)
        });
    }else {
        getLoginCookie('黄军平', 'HJPmain').then(function (cookie) {
            req.session.cookieData=cookie;
            getData(cookie).then(function (data) {
                var datas=JSON.parse(data.doc);
                var reDate={ 'ydzf': datas.ydzfrc, 'sxzz': datas.sxzj, 'rydj': datas.zyrc, 'yygh': datas.yyghrc, 'mzjz': datas.mzjzrc,'jkdady':data.jkdady.invokephrnum};
                //console.log(reDate)
                resp.send(reDate)
            });
        });
    }

});


module.exports = router;
