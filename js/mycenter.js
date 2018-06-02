template.defaults.imports.dateFormat = function(date) {
	return getTimeStr(date);
};

var centerObject = {};
var curWallet;

function getWallectInfo() {

	window.postMessage({
		"target": "contentscript",
		"data": {},
		"method": "getAccount",
	}, "*");
	window.addEventListener('message', function(e) {
		console.log(e, 111111111111111111)
		if (e.data && e.data.data && e.data.data.account) {
			if (e.data.data.account) {
				curWallet = e.data.data.account;
				queryCenterInfo();
			}
		} else {
			$(".loading").hide();
			alert("必须安装星云钱包插件！");
		}
	});
}

function queryCenterInfo() {
	//获取个人信息列表;
	query(curWallet, config.personal, "", function(resp) {
		console.log(resp, "获取个人信息返回数据");
		centerObject = JSON.parse(resp.result);
		console.log(centerObject, "获取个人信息返回数据");
		var respData = {}
		respData.list = centerObject.jokeInfos;
		var html = template('jokeScript', respData);
		document.getElementById('jokeBody').innerHTML = html;

		respData.commentList = centerObject.comments;
		html = template('commentScript', respData);
		document.getElementById('commentBody').innerHTML = html;

		respData.rewardList = centerObject.rewards;
		html = template('rewardScript', respData);
		document.getElementById('rewardBody').innerHTML = html;
		$(".loading").hide();
	});
}

function toIndexSearch() {
	var keyword = $("#keyword").val();
	window.location.href = "index.html?keyword=" + keyword;
}