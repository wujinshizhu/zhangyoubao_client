/**
 * Created by wujin on 16/8/10.
 */

rootModule.controller('SystemMsgListCtrl',function($scope,$rootScope,ChatCacheService,
                                                   $ionicPopup,$http,$state,$cordovaToast){

      $scope.systemMsgs = ChatCacheService.getSystemMsgs();

      $scope.onMsgClick = function(index){
          var msg = $scope.systemMsgs[index];
          if(msg.type == $rootScope.MSG_TYPE.APPLICATION){
              //!将该消息标记为已打开, 设置调用接口,传msg的index过去
              msg.has_read = true;
              //交易申请, chat_id用于从服务器端获取聊天数据, status用于交易申请页面的状态处理, msg_index表明系统消息的index,用于获取该系统消息
              $state.go("transaction-apply",{chat_id:msg.chat_id, status:2, msg_index:index})
          }
      }

});
