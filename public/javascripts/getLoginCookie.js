//访问登录接口获取cookie
const superagent = require('superagent');
// 浏览器请求报文头部部分信息
var browserMsg={
    "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36",
    'Content-Type':'application/x-www-form-urlencoded'
};
function getLoginCookie(user, pwd,url) {
    var url= require('./config').url;
    user = user.toUpperCase();
    var date=new Date();
    return new Promise(function(resolve, reject) {
        superagent.post(url+'/Home/Login').set(browserMsg).send({
            username: '黄军平',
            password: 'HJPmain'
        }).redirects(0).end(function (err, response) {
            if(err){
                console.log('服务器未响应')
            }else {
                //获取cookie
                var cookie = response.headers["set-cookie"];
                console.log(cookie+111)
                resolve(cookie);
            }

        });
    });
}
module.exports = getLoginCookie;
