//签约统计（年度）
var express = require('express');
var router = express.Router();
const superagent = require('superagent');
const cheerio = require('cheerio');
const request=require('request');
var getLoginCookie = require('../public/javascripts/getLoginCookie');
var writeFs = require('../public/javascripts/writeFs');
var isOverTime = require('../public/javascripts/isOverTime');
const url= require('../public/javascripts/config').url;
const jsonData= require('../json/signStatistics');


var browserMsg={
    "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36",
    'Content-Type':'application/x-www-form-urlencoded'
};

//设置
function getData(cookie) {
    return new Promise(function(resolve, reject) {
        //传入cookie
        superagent.get(url+'/FamilyDoctor/Statistic').set("Cookie",cookie).set(browserMsg).end(function(err,res) {
            if(err){
                console.log("error exception occured !");
                return next(error);
            }else {
                $=cheerio.load(res.text);
                var att={
                    familySign:{
                        totalSign:0,
                        i:0,
                        totalPercent:0,
                        signData:[]
                    },
                    creditSign:{}
                };

                var n=$('h3').eq(0).text().indexOf('%');
                att.familySign.totalPercent=$('h3').eq(0).text().substr(n-5,5);
                console.log(att.familySign.totalPercent)
                //签约统计在第二个表格里
                $('table').eq(1).find('tr').each(function (i,elem) {
                    let elemTd=$(elem).find('td');
                    if(elemTd.eq(0).text()){
                        att.familySign.totalSign+=Number(elemTd.eq(1).text());
                        att.familySign.i+=1;
                        att.familySign.signData.push({
                            OrgName: elemTd.eq(0).text(),
                            SingNum:elemTd.eq(1).text(),
                            SingPercent:elemTd.eq(2).text(),
                            RenewalPercent:elemTd.eq(3).text()
                        });
                    }
                });
                var d=new Date();
                var param={
                    'startDate':(d.getFullYear()-1)+'-'+(d.getMonth()+1)+'-'+d.getDate(),
                    'endDate':d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(),
                    'page': 1,
                    'pageSize': 100,
                    'type': 0,
                    'value': 0
                }
                superagent.post(url+'/payafter/SignCount').set("Cookie",cookie).set(browserMsg).send(param).end(function(err,res) {
                    //console.log(res.text)
                    att.creditSign.totalSign=JSON.parse(JSON.parse(res.text).Info).totalSign;
                    att.creditSign.signData=JSON.parse(JSON.parse(JSON.parse(res.text).Info).data);
                    resolve({
                        'cookie': cookie,
                        'doc': att
                    });
                })

            }
        });
    });
}


router.get("/",function(req,resp){
    //console.log(isOverTime(jsonData))
    if(req.session && req.session.cookieData){
        if(isOverTime(jsonData,'20000000000')){
            resp.send(jsonData)
        }else {
            getData(req.session.cookieData).then(function (data) {
                resp.send(data.doc);
                data.doc.timeStamp=new Date();
                writeFs('./json/signStatistics.json',data.doc);
            });
        }

    }else {
            if(isOverTime(jsonData,'20000000000')){
                resp.send(jsonData)
            }else {
                getLoginCookie('黄军平', 'HJPmain').then(function (cookie) {
                    req.session.cookieData=cookie;
                    getData(cookie).then(function (data) {
                        resp.send(data.doc);
                        data.doc.timeStamp=new Date();
                        writeFs('./json/signStatistics.json',data.doc);
                    });
                });
            }

    }

});


module.exports = router;
