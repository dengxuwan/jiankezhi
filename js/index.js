template.defaults.imports.dateFormat = function(date) {
	return getTimeStr(date);
};

var curWallet = "";

//获取钱包地址
function getWallectInfo() {
	window.postMessage({
		"target": "contentscript",
		"data": {},
		"method": "getAccount",
	}, "*");
	window.addEventListener('message', function(e) {
		if (e.data && e.data.data) {
			if (e.data.data.account) {
				curWallet = e.data.data.account;
			}
		}
	});
}
function getJokeInfoList(address){
	//获取段子列表
	query(address, config.getAll, "", function(resp) {
		console.log(resp, "智能合约获取列表");
		var respArr = JSON.parse(resp.result)
		console.log(respArr, "智能合约获取列表");
		initJokeList(respArr);
		$(".loading").hide()
	});
}
function initJokeList(respArr){
	var respData = {}
	respData.list = respArr
	var html = template('list', respData);
	document.getElementById('content-box').innerHTML = html;
}
//投稿
function addJokeInfo() {
	//这里需要判断是否填写了必填项目
	var title = $("#joke_title").val();
	var content = $("#joke_content").val();
	var joke_pics = $(".sendbox");
	var pics = "";
	if (joke_pics.find(".imgAddress").length >= 1) {
		for (var i = 0; i < joke_pics.find(".imgAddress").length; i++) {
			pics += joke_pics.find(".imgAddress").eq(i).find(".joke_pic").val();
			if (i !== joke_pics.find(".imgAddress").length - 1) {
				pics += ",";
			}
		}

	}
	if(title==='' || pics===''){
		alert('标准和图片链接不能为空!');
		return;
	}
	var args = [title,content,pics];
	console.log(JSON.stringify(args), '投稿参数');
	defaultOptions.listener = function(data) {
		$(".dialog").hide(100)
		alert('投稿成功,大约15秒后数据打包写入区块链，请稍后刷新查看');
		//开启定时任务，获取交易状态
		 intervalQuery = setInterval(function () {
             funcIntervalQuery();
         }, 6000);
		// if (typeof data === "object") {
		// 	tips('投稿成功,大约15秒后数据打包写入区块链，请稍后刷新查看。', true);
		// } else {
		// 	tips(data, false);
		// }
	};
	serialNumber = nebPay.call(config.contractAddr, "0", config.addJoke, JSON.stringify(args), defaultOptions);
}

//发表评论
function sendComment() {
	if (curWallet==='') {
		alert("评论段子必须安装星云钱包插件！");
		return;
	}
	var content = $("#commentContent").val();
	if(content === ''){
		alert('必须填写评论内容！');
		return;
	}
	var args = [clickJokeId,content];
	defaultOptions.listener = function(data) {
		$(".dialog").hide(100)
		alert('评论成功,大约15秒后数据打包写入区块链，请稍后刷新查看');
		//开启定时任务，获取交易状态
		 intervalQuery = setInterval(function () {
             funcIntervalQuery();
         }, 6000);
	};
	serialNumber = nebPay.call(config.contractAddr, "0", config.comment, JSON.stringify(args), defaultOptions);
}

//打赏
function reward(){
	if (curWallet==='') {
		alert("打赏作者必须安装星云钱包插件！");
		return;
	}
	if(clickAmount==='' || clickAmount==='0'){
		alert('请选择打赏金额');
		return
	}
	var args = [clickJokeId];
	defaultOptions.listener = function(data) {
		$(".dialog").hide(100)
		alert('打赏成功,大约15秒后数据打包写入区块链，请稍后刷新查看');
		//开启定时任务，获取交易状态
		 intervalQuery = setInterval(function () {
             funcIntervalQuery();
         }, 6000);

	};
	serialNumber =nebPay.call(config.contractAddr, clickAmount+"", config.reward, JSON.stringify(args), defaultOptions);
}

 function funcIntervalQuery() {
        nebPay.queryPayInfo(serialNumber)   //search transaction result from server (result upload to server by app)
            .then(function (resp) {
                var respObject = JSON.parse(resp)
                console.log(respObject,"获取交易状态返回对象")   //resp is a JSON string
                if(respObject.code === 0 && respObject.data.status === 1){ //说明成功写入区块链
                    getJokeInfoList(curWallet);
                    //关闭定时任务
                    clearInterval(intervalQuery)
                }
            })
            .catch(function (err) {
                console.log(err);
            });
    }
function toSearch(){
	keyword = $("#keyword").val();
	search(keyword);

}
function search(keyword){
	$(".loading").show();//显示进度表加载数据
	if (!keyword || keyword === '') {
		//查询全部
		getJokeInfoList(config.myAddress);
	} else {
		//说明是关键字搜索
		$("#keyword").val(keyword);
		var temp = [keyword];
		query(config.myAddress, config.search,JSON.stringify(temp), function(resp) {
			console.log(resp, "搜索智能合约获取列表");
			var respArr = JSON.parse(resp.result)
			var respData = {}
			respData.list = respArr
			var html = template('list', respData);
			document.getElementById('content-box').innerHTML = html;
			$(".loading").hide();//隐藏进度表加载数据
		});
	}
	
}
//段子列表按照评论人数进行排序方法
function SortByCommentNum(JokeInfos){
	return JokeInfos.sort(cCompare);
}
//段子列表按照评论人数进行排序方法
function SortByRewardAmount(JokeInfos){
	return JokeInfos.sort(rCompare);
}
//段子列表按照评论人数进行排序方法
function cCompare(x, y) {//比较函数
    if (x.comments.length < y.comments.length ) {
        return 1;
    } else if (x.comments.length  > y.comments.length ) {
        return -1;
    } else {
        return 0;
    }
}
//段子列表按照打赏金额进行排序
function rCompare(x, y) {//比较函数
	 if (x.amount < y.amount ) {
        return 1;
    } else if (x.amount  > y.amount ) {
        return -1;
    } else {
        return 0;
    }
}
//只筛选出指定日期的段子
function filterByDate(jokeInfos, DateStr){
	var list = [];
	$.each(jokeInfos,function(index,element){
		var time = jokeInfos.time;
		if (isToday(DateStr, time*1000)){
			list.push(element);
		}
	})
}
var keyword;
$(function() {
	getWallectInfo();
		//获取参数
	$(".loading").show();//显示进度表加载数据
	keyword  = getQueryString("keyword");
	if (!keyword || keyword === '') {
		getJokeInfoList(config.myAddress);
	} else {
		//说明是搜索
		$("#keyword").val(keyword);
		search(keyword);
	}
	
});