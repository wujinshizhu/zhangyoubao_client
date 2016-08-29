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
              ChatCacheService.updateSystemMsgUnread();
              //交易申请, chat_id用于从服务器端获取聊天数据, status用于交易申请页面的状态处理, msg_index表明系统消息的index,用于获取该系统消息
              $state.go("transaction-apply",{chat_id:msg.chat_id, status:2, msg_index:index})
          }
      };

      $scope.removeSysMsg = function(index){
          if(ChatCacheService.removeSystemMsg(index)){
              $cordovaToast.showShortCenter('删除成功');
          }
      };

      $scope.onClearAll = function(){
          $ionicPopup.confirm({
            title: '清空数据',
            template: '清空消息不可恢复,是否确认清空系统消息',
            cancelText: '取消',
            okText: '确认'
          }).then(function(result){
            if(result){
              if(ChatCacheService.clearSystemMsg()){
                  // 刷新当前系统消息列表
                  $scope.systemMsgs = ChatCacheService.getSystemMsgs();
                  $cordovaToast.showShortCenter('清空成功');
              }
            }
          });
      };



});
