/*实时就诊信息*/
var express = require('express');
var router = express.Router();
const superagent = require('superagent');
const cheerio = require('cheerio');
const request=require('request');
var getLoginCookie = require('../public/javascripts/getLoginCookie');
const url= require('../public/javascripts/config').url;
var session = require('express-session');
var writeFs = require('../public/javascripts/writeFs');
var isOverTime = require('../public/javascripts/isOverTime');
const jsonData= require('../json/healthRecords');


// 浏览器请求报文头部部分信息
var browserMsg={
    "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36",
    'Content-Type':'application/x-www-form-urlencoded'
};


//设置
function getData(cookie) {
    var d=new Date();
    var param={
        'startdate':(d.getFullYear()-1)+'-'+(d.getMonth()+1)+'-'+d.getDate(),
        'enddate':d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(),
        'zzjgdm':'',
        'excel':false
    };
    return new Promise(function(resolve, reject) {
        //传入cookie
        superagent.post(url+'/Report/InvokePHRAnalysis').set("Cookie",cookie).set(browserMsg).send(param).end(function(err,res) {
            var datas = JSON.parse(JSON.parse(JSON.parse(res.text).Info).data);
            var Total_Num=0,InvokePHR_Num=0;
            datas.forEach(function (item) {
                //console.log(item)
                Total_Num+=Number(item.Total_Num);
                InvokePHR_Num+=Number(item.InvokePHR_Num);
            });
            resolve({
                'datas': datas,
                'Total_Num':Total_Num,
                'InvokePHR_Num':InvokePHR_Num,
                'InvokePHR_Rate':(InvokePHR_Num/Total_Num*100).toFixed(2)
            });
        })
    });
}

router.get("/",function(req,resp){
    //console.log(isOverTime(jsonData))
    if(req.session && req.session.cookieData){
        if(isOverTime(jsonData,'20000000000')){
            resp.send(jsonData)
        }else {
            getData(req.session.cookieData).then(function (data) {
                resp.send(data);
                if(data){
                    data.timeStamp=new Date();
                    writeFs('./json/healthRecords.json',data);
                }
            });
        }

    }else {
        getLoginCookie('黄军平', 'HJPmain').then(function (cookie) {
            req.session.cookieData=cookie;
            getData(cookie).then(function (data) {
                resp.send(data);
                if(data){
                    data.timeStamp=new Date();
                    writeFs('./json/healthRecords.json',data);
                }
            });
        });
    }

});


module.exports = router;
