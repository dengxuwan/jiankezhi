template.defaults.imports.dateFormat = function(date) {
	return getTimeStr(date);
};

var curWallet = "";

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

//发表评论
function sendComment() {
	if (curWallet === '') {
		alert("评论段子必须安装星云钱包插件！");
		return;
	}
	var content = $("#commentContent").val();
	if (content === '') {
		alert('必须填写评论内容！');
		return;
	}
	var args = [jokeInfoId, content];
	defaultOptions.listener = function(data) {
		$("#commentContent").val('');
		//开启定时任务，获取交易状态
		// intervalQuery = setInterval(function () {
		//           funcIntervalQuery();
		//       }, 6000);
		alert('发表评论成功！写入区块链约15秒!');
	};
	serialNumber = nebPay.call(config.contractAddr, "0", config.comment, JSON.stringify(args), defaultOptions);
}

function funcIntervalQuery() {
	nebPay.queryPayInfo(serialNumber) //search transaction result from server (result upload to server by app)
		.then(function(resp) {
			var respObject = JSON.parse(resp)
			console.log(respObject, "获取交易状态返回对象") //resp is a JSON string
			if (respObject.code === 0 && respObject.data.status === 1) { //说明成功写入区块链
				queryJokeInfo(true);
				//关闭定时任务
				clearInterval(intervalQuery)
			}
		})
		.catch(function(err) {
			console.log(err);
		});
}

var amount = 0;
//查询段子信息
function queryJokeInfo(onlyComment) {
	console.log("准备获取段子详情，段子ID:" + jokeInfoId);
	var temp = [jokeInfoId];
	query(config.myAddress, config.getJokeInfo, JSON.stringify(temp), function(resp) {
		console.log(resp, "获取段子详情");
		var jokeInfo = JSON.parse(resp.result);
		if (!onlyComment) {
			$("#title").html(jokeInfo.title);
			$("#author").html("作者:" + jokeInfo.author);
			$("#time").html("时间:" + getTimeStr(jokeInfo.time));
			$("#content").html(jokeInfo.content);
			amount = jokeInfo.amount;
			$("#amount").html("赏金: " + amount + "Nas");
			var picsDiv = $("#picsDiv");
			var pic = $("#pic");
			picsDiv.html(); //先清空之前的
			$.each(jokeInfo.pics, function(index, element) {
				var clone = pic.clone();
				clone.find("img").attr("src", element);
				picsDiv.append(clone);
			})
		}
		$("#praiseCount").html("评论人数: " + jokeInfo.comments.length + "人");
		var respData = {}
		respData.list = jokeInfo.comments
		var html = template('list', respData);
		document.getElementById('comments_ul').innerHTML = html;
		$(".loading").hide();
	});
}

//打赏
function reward() {
	if (curWallet === '') {
		alert("打赏段子必须安装星云钱包插件！");
		return;
	}
	if (clickAmount === '' || clickAmount === '0') {
		alert('请选择打赏金额');
		return
	}
	var args = [jokeInfoId];
	defaultOptions.listener = function(data) {
		$(".dialog").hide(200)
		console.log(data, '添加评论返回数据');
		alert('打赏成功，数据15秒时间内会写入区块链，稍后会自动刷新数据！');
		amount = Number(amount) + Number(clickAmount);
		$("#amount").html("赏金: " + amount + "Nas");
	};
	serialNumber = nebPay.call(config.contractAddr, clickAmount + "", config.reward, JSON.stringify(args), defaultOptions);

}

var jokeInfoId = "";
$(function() {
	$(".loading").show();
	//获取参数
	jokeInfoId = getQueryString("jokeInfoId");
	if (!jokeInfoId || jokeInfoId === '') {
		alert('参数有误!');
		return;
	}
	getWallectInfo(); //获取钱包地址
	//获取段子详情
	queryJokeInfo(false);

})

function toIndexSearch() {
	var keyword = $("#keyword").val();
	window.location.href = "index.html?keyword=" + keyword;
}