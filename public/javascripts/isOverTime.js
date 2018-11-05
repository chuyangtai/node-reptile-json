//判断过期时间，30天请求一次,否则发送本地数据,true发送本地数据
//json文件地址，过期时间
function isOverTime(json,time) {
    if(json && json.timeStamp){
        let timeStamp=new Date(json.timeStamp);
        let nowTime=new Date();
        if((nowTime-timeStamp)>=Number(time)){
            console.log(nowTime-timeStamp)
            return false
        }else {
            return true
        }
    }else {
        return false
    }
}


module.exports = isOverTime;
