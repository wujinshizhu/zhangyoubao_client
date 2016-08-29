rootService.factory('SocketService',function(socketFactory,$rootScope,ChatCacheService,$cordovaLocalNotification,
                                             $ionicPopup,LogOutService,$cordovaToast,$cordovaVibration,$cordovaNativeAudio){
	//Create socket and connect to http://chat.socket.io

    var serverUrl=null;
// 	var myIoSocket = io.connect('http://chat.socket.io');
    //js socket.io 的socket对象
    var socketIoObj = null;
    //angualrj socket.io的socket对象
  	var angularSocket=null;
    //用于标记
    var connected=false;
    //在用户登录成功后，自动进行聊天服务器的登录
    function loginChatServer()
    {
        serverUrl="http://"+$rootScope.SERVER_ADDRESS+":"+$rootScope.CHAT_SERVER_PORT;
        socketIoObj=io.connect(serverUrl);
        console.log(serverUrl);
        angularSocket = socketFactory({
            ioSocket: socketIoObj
        });
        //定义myIoSocket的各项响应功能
        //聊天服务器登录成功
        angularSocket.on('connect',function(){
            console.log('聊天服务器登录成功');
            connected = true;
            //用户登录成功，传入用户的id，作为用户的唯一标识，同时传入上一次接收到的消息id，从而推送离线期间未接受到的消息信息
            var login_data=getUsefulUserInfo();
            var last_receive_id=ChatCacheService.getLastIdReceive();
            if(last_receive_id)
            {
                login_data.last_receive_id=last_receive_id;
            }
            angularSocket.emit('login', login_data);

        });

        angularSocket.on('connect_error',function(e){
            console.log('聊天服务器登录失败');
            connected = false;
            console.log(e);
        });

        angularSocket.on('connect_timeout',function(){
            console.log('聊天服务器连接超时');
            connected = false;
        });

        angularSocket.on('reconnect',function(reconnect_number){
            console.log('重连聊天服务器成功,已重连'+reconnect_number+'次');
            connected = true;
        });

        angularSocket.on('reconnect_attempt',function(){
            console.log('尝试重连聊天服务器中');
        });


        angularSocket.on('reconnecting',function(reconnect_number){
            console.log('正在重连聊天服务器，已尝试'+reconnect_number+'次');
        });

        angularSocket.on('reconnect_error',function(e){
            console.log('重连聊天服务器失败');
            connected = false;
            console.log(e);
        });

        angularSocket.on('reconnect_failed',function(){
            console.log('连续重连聊天服务器失败,已放弃重连');
        });

        angularSocket.on('disconnect',function(){
            console.log('已断开连接');
            connected = false;
        });

        angularSocket.on('message_success',function(obj){
            //将消息状态置为成功
            console.log('message_success');
            ChatCacheService.setMsgSendSuccess(obj);
        });

        angularSocket.on('apply_success',function(){
          //将申请状态设置为成功
          console.log('apply_success');
          $rootScope.apply_state = $rootScope.TRANSACTION_APPLY_STATUS.APP_SUCCESS;
        });

        //交易申请失败
        angularSocket.on('apply_error',function(){
          console.log('apply_error');
          $rootScope.apply_state = $rootScope.TRANSACTION_APPLY_STATUS.ERROR;
        });

        angularSocket.on('new_message',function(msg){
            if(msg.hasOwnProperty('msg_create_time_local'))
            {
                delete msg.msg_create_time_local;
            }
            console.log('接收到数据');
            console.log(msg);
            ChatCacheService.recevieMessage(msg);
            //接收到消息时振动500ms
            $cordovaNativeAudio.play('new_message');
            $cordovaVibration.vibrate(500);
            //判断当前当前软件是否激活，只有当前软件在后台时才显示通知
            if(!$rootScope.isActive)
            {
                var title = null;
                var text = null;
                if(msg.type == $rootScope.MSG_TYPE.APPLICATION){
                    title = '您收到新的交易申请';
                    text = '系统消息: ' + msg.content;
                }
                else{
                    title = '您有'+$rootScope.UnReadMsgNum+'条新的私信';
                    text = msg.userNameRespect+': '+msg.content;
                }
                $cordovaLocalNotification.schedule({
                    id:   $rootScope.LOCAL_NOTIFY_ID.MESSAGE,
                    title: title,
                    text: text,
                    badge: $rootScope.UnReadMsgNum,
                    icon: '../resources/icon.png'
                },function(){
                    console.log("回调函数触发");
                }).then(function (result) {
                    //这不是回调，只是发送后的提示
                    if(result!="OK")
                    {
                        console.error("通知推送失败");
                    }
                });
            }

            //if(BadgeService.getBadgePermission())
            //{
            //    $cordovaBadge.set($rootScope.UnReadMsgNum).then(function() {
            //        console.log('badge 设置成功');
            //    }, function(err) {
            //        console.error(err);
            //      // You do not have permission.
            //    });
            //}

            //通知服务器，客户端接收到消息
            angularSocket.emit('msg_receive',msg.chat_id);
        });

        //接收到重复登录的消息
        angularSocket.on('duplicated_login',function(){
            $ionicPopup.alert({
                title: '账户重复登录',
                template: '您的账号已经在另一台设备上登录，如果该登录操作不是您本人进行的，请及时修改您的登录密码或者联系客服人员'
            });
            //由于设计上的问题，将登出的部分提出来共用
            disconnect();
            LogOutService.logout();
        });


        //接收到离线期间未推送的消息
        angularSocket.on('UnPushed_Msg',function(msgs){
            console.log('接收到未推送数据');
            console.log(msgs);
            ChatCacheService.receviceMsgArray(msgs);

            //通知服务器，客户端接收到消息，这边还未完成
            chat_ids=[];
            for(var i=0;i<msgs.length;i++)
            {
                chat_ids.push(msgs[i].chat_id);
            }
            angularSocket.emit('msg_receive_array',chat_ids);
        });
    }



    function isConnected(){
        return connected;
    }

    //当用户退出登录或者退出程序时主动断开和聊天服务器的连接
    function disconnect(){
        if(connected)
        {
            angularSocket.disconnect();
            angularSocket.emit('disconnect');
        }
    }

    //返回angularSocket，用于消息发送状态的监控
    function getChatSocket(){
        return angularSocket;
    }

    function sendMessage(content,chat_user_id,type){
        //获取当前时间
        var currTime = $rootScope.getNowFormatDate();
        var src_info=getUsefulUserInfo();
        //发送的消息格式
        var msg={
            type:  type,
            content: content,
            target_id: chat_user_id,
            src_id: $rootScope.userInfo.user_id,
            //本地的信息创建时间，用于发送成功后的聊天记录状态改变
            msg_create_time_local: currTime,
            userNameRespect: $rootScope.userInfo.userNameRespect, //发送方的尊称
            avatars_name: $rootScope.userInfo.avatars_name, //发送方的头像
            src_level: $rootScope.userInfo.level //发送方的用户权限等级
        };
        console.log("发送的信息");
        console.log(msg);
        angularSocket.emit('message', msg);

        //消息发送的状态记录，该状态量只有自己是发送方时才拥有
        msg.send_state=$rootScope.MSG_SEND_STATE.WAITING_RESULT;
        ChatCacheService.addSendChatRecord(chat_user_id,msg);

    }

    function sendTransactionApply(content){
      //获取当前时间
      var currTime = $rootScope.getNowFormatDate();
      var src_info = {
        userInfo : getUsefulUserInfo(),
        storeInfo: $rootScope.storeInfo ? $rootScope.storeInfo : null
      };
      //发送的消息格式
      var msg={
        type:  $rootScope.MSG_TYPE.APPLICATION,
        content: content,
        target_id: content.receiveUserId,
        src_id: $rootScope.userInfo.user_id,
        src_info: src_info,
        msg_create_time_local: currTime,
        userNameRespect: $rootScope.userInfo.userNameRespect, //发送方的尊称
        avatars_name: $rootScope.userInfo.avatars_name, //发送方的头像
        src_level: $rootScope.userInfo.level //发送方的用户权限等级
      };
      console.log("发送的交易申请");
      console.log(msg);
      angularSocket.emit('transaction_apply', msg);
      //本地对于申请不再进行记录
      ////消息发送的状态记录，该状态量只有自己是发送方时才拥有
      //msg.send_state=$rootScope.MSG_SEND_STATE.WAITING_RESULT;
      //ChatCacheService.addSendChatRecord(chat_user_id,msg);
    }




    //失败的消息手动重发
    function msgResend(msg){
        //重新获取发送时间
        msg.msg_create_time_local=$rootScope.getNowFormatDate();
        delete msg.send_state;
        angularSocket.emit('message', msg);
        //消息发送的状态记录，该状态量只有自己是发送方时才拥有
        msg.send_state=$rootScope.MSG_SEND_STATE.WAITING_RESULT;
        ChatCacheService.addSendChatRecord(msg.target_id,msg);
    }

    function getUsefulUserInfo()
    {
        var userInfo=angular.copy($rootScope.userInfo);
        delete userInfo.focus_store_ids;
        delete userInfo.focus_trade_ids;
        return userInfo;
    }

	return {
        loginChatServer: loginChatServer,
        isConnected: isConnected,
        disconnect: disconnect,
        getChatSocket: getChatSocket,
        sendMessage: sendMessage,
        msgResend: msgResend,
        sendTransactionApply: sendTransactionApply
    }
});
