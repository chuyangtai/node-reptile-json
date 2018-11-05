/*预约挂号-展示一年*/
var express = require('express');
var router = express.Router();
const superagent = require('superagent');
const cheerio = require('cheerio');
const request=require('request');
var getLoginCookie = require('../public/javascripts/getLoginCookie');
var writeFs = require('../public/javascripts/writeFs');
var isOverTime = require('../public/javascripts/isOverTime');
var session = require('express-session');
const url= require('../public/javascripts/config').url;
const jsonData= require('../json/registerPerYear');

var browserMsg={
    "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36",
    'Content-Type':'application/x-www-form-urlencoded'
};

//设置
function getData(cookie) {
    var d=new Date();
    var param={
        'startDate':(d.getFullYear()-1)+'-'+(d.getMonth()+1)+'-'+d.getDate(),
        'endDate':d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(),
        'mode':0
    };
    var param2={
        'startDate':(d.getFullYear()-1)+'-'+(d.getMonth()+1)+'-'+d.getDate(),
        'endDate':d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(),
    };
    return new Promise(function(resolve, reject) {
        //传入cookie
        superagent.post(url+'/Report/TrendAnalysis').set("Cookie",cookie).set(browserMsg).send(param).end(function(err,res) {
            if(res.text){
                var datas= JSON.parse(res.text).Info;
            }else {
                return;
            }
            superagent.post(url+'/Report/AgeAnalysis').set("Cookie",cookie).set(browserMsg).send(param2).end(function(err,resp) {
                var datas2= JSON.parse(resp.text).Info;
                superagent.post(url+'/Report/YYGHOnTimeVisitRate').set("Cookie",cookie).set(browserMsg).send(param2).end(function(err,resp) {
                    var datas3= JSON.parse(resp.text).Info;
                    resolve({
                        'number': datas,
                        'ageData':datas2,
                        'rateData':datas3
                    });
                });
            });

        });
    });
}


router.get("/",function(req,resp){
    if(req.session && req.session.cookieData){
        if(isOverTime(jsonData,'20000000000')){
            resp.send(jsonData)
        }else {
            getData(req.session.cookieData).then(function (data) {
                var datas={};
                datas.number=JSON.parse(data.number);
                datas.ageData=JSON.parse(data.ageData).agedata;
                datas.rateData=JSON.parse(data.rateData).ratedata;
                datas.timeStamp=new Date();
                writeFs('./json/registerPerYear.json',datas);
                resp.send(datas)
            });
        }
    }else {
        getLoginCookie('黄军平', 'HJPmain').then(function (cookie) {
            req.session.cookieData=cookie;
            if(isOverTime(jsonData)){
                resp.send(jsonData)
            }else {
                getData(cookie).then(function (data) {
                    var datas={};
                    datas.number=JSON.parse(data.number);
                    datas.ageData=JSON.parse(data.ageData).agedata;
                    datas.rateData=JSON.parse(data.rateData).ratedata;
                    datas.timeStamp=new Date();
                    writeFs('./json/registerPerYear.json',datas);
                    resp.send(datas)
                });
            }
        });
    }

});


module.exports = router;
