var fs = require('fs'), path = require('path');//'./json/registerPerYear.json'

function writeFs(jsonUrl, json) {
    //let ans = {name: '张三'}
    let Str_ans = JSON.stringify(json, null, 4);
    fs.writeFile(jsonUrl, Str_ans, 'utf8', (err) => {
        if (err) {
            console.log(err);
        }else {
            console.log('done');
        }
    });
}


module.exports = writeFs;
