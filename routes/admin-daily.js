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

//http://10.8.78.12:8080/Report/DailyService
//设置
function getData(cookie) {
    var d=new Date();
    //近一个月
    var param={
        'startDate':d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate(),
        'endDate':d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(),
        'hosType': 'hz'
    };
    return new Promise(function(resolve, reject) {
        //传入cookie
        superagent.post(url+'/ReportChat/GetHZList').set("Cookie",cookie).set(browserMsg).send(param).end(function(err,res) {
           if(err){
               console.log(err.Error);
           }else{
               var datas = JSON.parse(JSON.parse(JSON.parse(res.text).Info).data);
               var arr=[];
               datas.forEach(function (item,i) {
                   var ItemNum=0;
                   var ItemName={};
                   var n=0;
                   for (o in item) {
                       if(o=='Info'){
                           ItemName=item[o];
                       }else {
                           ItemNum+=Number(item[o]);
                           n++;
                       }
                   }
                   if(ItemName=='yydm'){//剔除最后一项数组
                       return;
                   }else {
                       if(ItemName.indexOf('%')>-1){
                           // console.log(ItemName);
                           arr.push({'name':ItemName,'ItemNum':(ItemNum/n).toFixed(2)});//比率计算平均数
                       }else {
                           arr.push({'name':ItemName,'ItemNum':ItemNum.toFixed(2)});//总计累加
                       }
                   }

               });
           }
            //日报,前一天的日报
            var param2={
                'startDate':d.getFullYear()+'-'+(d.getMonth()+1)+'-'+(d.getDate()-1),
                'endDate':d.getFullYear()+'-'+(d.getMonth()+1)+'-'+(d.getDate()-1),
                'orgCode': '0',
                'hosType': '0',
                'mzType': '1'
            };

            superagent.post(url+'/Report/DailyService').set("Cookie",cookie).set(browserMsg).send(param2).end(function(err,res) {
                if(!res){
                    return;
                }
                var datas=JSON.parse(JSON.parse(JSON.parse(res.text).Info).data);
                var arr2= {
                    medicalNum: [],
                    medicalFee: [],
                    medicalRatio:{
                        xAxis:{},
                        source:[]
                    }
                }
                datas.forEach(function (item) {
                    arr2.medicalNum.push({'orgName':item.zzjgmc,'jzrc':Number(item.jzrc),'ybmzNumRatio':(Number(item.ybmzrc)/Number(item.jzrc)*100).toFixed(2),'zfmNumRatio':(Number(item.zfmzrc)/Number(item.jzrc)*100).toFixed(2),'xkbNumRatio':(Number(item.xkbmzrc)/Number(item.jzrc)*100).toFixed(2)});
                    arr2.medicalFee.push({'orgName':item.zzjgmc,'jzFee':Number(item.jzzfy)/10000,'jcFee':(Number(item.jzzfy)/Number(item.jzrc)).toFixed(2),'ybbxFeeRatio':(Number(item.ybbxfy)/Number(item.jzzfy)*100).toFixed(2),'ybzfFeeRatio':(Number(item.ybzffy)/Number(item.jzzfy)*100).toFixed(2)});
                });
                superagent.post(url+'/ReportChat/AreaTreatment').set("Cookie",cookie).set(browserMsg).send({'cmd': 'medicalservice'}).end(function(err,res) {
                    if(!res){
                        return;
                    }
                    arr2.medicalRatio.xAxis=JSON.parse(JSON.parse(JSON.parse(res.text).Info).hospitalName);
                    var datas=JSON.parse(JSON.parse(JSON.parse(res.text).Info).datas);
                    datas.forEach(function (item) {
                        arr2.medicalRatio.source.push(item.DataList[7]);
                    });
                    resolve({
                        'dailyReport':arr2,
                        'monthlyReport': arr
                    });
                });

            });

        })
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
