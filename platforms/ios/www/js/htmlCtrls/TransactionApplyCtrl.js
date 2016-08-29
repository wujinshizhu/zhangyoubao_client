/**
 * Created by wujin on 16/7/24.
 * 交易申请页面的控制器
 */

rootModule.controller('TransactionApplyCtrl', function($scope, $stateParams, $state, $rootScope, $ionicPopup, ExceptionService,UserNameService,
                                                       SocketService, $ionicLoading, $cordovaToast, ChatCacheService, $http, ImgPathService) {

    $rootScope.checkLogin();
    // 该页面分为四种用法, 一是用户自己填写交易申请的时候, 二是,用户收到交易申请,进行查看的时候
    // 三是交易消息确认接收之后, 四是交易拒绝
    var status = {
      apply: 1,
      view_apply: 2,
      confirmed: 3,
      rejected: 4
    };
    var chat_id = null;
    $scope.curr_status = status.apply;
    var msg_index = null;

    // 尝试获取传递过来的参数信息
    chat_id = $stateParams.chat_id;
    $scope.curr_status = $stateParams.status;
    msg_index = $stateParams.msg_index;



    // 一旦交易成功后, 将可以看到用户所有的身份信息
    function hideenPartInfo() {
        if($scope.curr_status != status.confirmed) {
            $scope.idNumHidden = $scope.applyUserInfo.id_num.substring(0,$scope.applyUserInfo.id_num.length - 4);
            $scope.idNumHidden += '****';
            console.log($scope.idNumHidden);
        }
        else{
          $scope.idNumHidden= $scope.userInfo.id_num;
        }
    }

    function getTransactionInfo(chat_id){
        var $url='https://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Transaction/getTransactionInfoByChatId';
        angular.toJson($data);
        $http({
          method: 'GET',
          url: $url,
          params: {
              chat_id: chat_id
          }
        }).
        success(function(data, status, headers, config)
        {
          switch (status)
          {
            case 200:
              console.log(data);
              angular.fromJson(data);
              $scope.applyInfo = data.transInfo;
              if($scope.applyInfo){
                if($scope.applyInfo.money) {
                  $scope.applyInfo.money = Number($scope.applyInfo.money);
                }
                if($scope.applyInfo.transaction_type){
                  $scope.applyInfo.transaction_type = Number($scope.applyInfo.transaction_type);
                  if($scope.applyInfo.transaction_type == $rootScope.TRANS_TYPE.GOODS_FIRST){
                    $scope.applyInfo.transaction_type_name = '先款后货';
                  }
                  else{
                    $scope.applyInfo.transaction_type_name = '先货后款';
                  }
                }
              }

              console.log($scope.applyInfo);
              // 每次获取用户信息时,记得处理用户的尊称
              UserNameService.setUserNameRespect(data.userInfo);
              ImgPathService.genUserAndStoreImgUrl(data);
              $scope.applyUserInfo = data.userInfo;
              hideenPartInfo();
              $scope.tradeApplyInfo = data.tradeInfo;
              ImgPathService.generateTradeImgUrl($scope.tradeApplyInfo);
              $scope.storeInfo = data.storeInfo;
              break;
          }
        }).
        error(function(data, status, headers, config)
        {
          switch(status){
            case 404:
                ExceptionService.applicationNotExistError();
                break;
            default:
                ExceptionService.defaultError();
                break;
          }
        });
    }


    $scope.applyUserInfo = null;
    $scope.storeInfo = null;

    // 提取当前用户的个人信息并填充进页面
    switch(Number($scope.curr_status)){
        case status.apply:
            $scope.applyUserInfo = $rootScope.userInfo;
            if($scope.applyUserInfo.level == $rootScope.USER_LEVEL.STORE_OWNER){
              $scope.storeInfo = $rootScope.storeInfo
            }
            $scope.tradeApplyInfo = $rootScope.tradeApplyInfo;
            if(!$scope.tradeApplyInfo) {
              // 商品信息不存在,逻辑上不会出现,这边以后需要添加发送错误日志到服务器端
              $state.go('tab.home')
            }
            hideenPartInfo();
            // 记录用户填写的表单和一些需要存储到数据库的字段
            $scope.applyInfo = {
              apply_user_id: $scope.applyUserInfo.user_id,
              receive_user_id: $scope.tradeApplyInfo.user_id,
              trade_id: $scope.tradeApplyInfo.trade_id,
              apply_description: null,
              transaction_type: $rootScope.TRANS_TYPE.GOODS_FIRST,
              money: null
            };
            break;
        case status.view_apply:
            if(chat_id && msg_index) {
                // 获取申请的用户信息
                var msg = ChatCacheService.getSystemMsgByIndex(msg_index);
                if(msg.type == $rootScope.MSG_TYPE.APPLICATION)
                {
                    // 从服务器后台获取交易申请信息, 同时需要包括具体商品的信息, 用户信息, 用户实体店信息等
                    getTransactionInfo(chat_id);
                }
                else
                {
                    ExceptionService.paramsError();
                }

            }
            else{
                ExceptionService.paramsError();
            }
            break;
        default:
            break;
    }

    $scope.transactionTypes=[{
      value: $rootScope.TRANS_TYPE.GOODS_FIRST,
      name: '先货后款'
    }, {
      value: $rootScope.TRANS_TYPE.MONEY_FIRST,
      name: '先款后货'
    }];

    $scope.onSubmit=function(){
      // 对于交易金额进行正则验证
      if(typeof($scope.applyInfo.money)!="number" || Number($scope.applyInfo.money) <= 0){
          $ionicPopup.alert({
              title: '输入提示',
              template:'请输入有效的交易金额',
              okText: '确认'
          });
          return;
      }
      console.log($scope.applyInfo);
      if(!SocketService.isConnected())
      {
          $cordovaToast.showShortCenter("暂未连上聊天服务器,请检查网络连接后重试");
      }
      else
      {
          SocketService.sendTransactionApply($scope.applyInfo);
          $rootScope.apply_state = $rootScope.TRANSACTION_APPLY_STATUS.APPLYING;
          $ionicLoading.show({
            template: '提交申请中...'
          });
          $scope.$watch(function(){
              return  $rootScope.apply_state;
          },function(newValue){
              switch(newValue){
                case $rootScope.TRANSACTION_APPLY_STATUS.APP_SUCCESS:
                  $cordovaToast.showShortCenter("申请成功,您可以在个人页面查看您全部的交易状态");
                  $ionicLoading.hide();
                  //交易申请成功后跳转
                  $rootScope.goBack();
                  break;
                case $rootScope.TRANSACTION_APPLY_STATUS.ERROR:
                  $cordovaToast.showShortCenter("申请失败,请确认网络连接后重试");
                  $ionicLoading.hide();
                  break;
              }
          });
      }

    };

    $scope.onCancel=function(){
      $rootScope.goBack();
    };

    //当用户点击私信的时候，判断是否是自己
    $scope.onClickChat=function(){
      $rootScope.checkLogin();
      if(!$rootScope.detectIsSelf($scope.applyUserInfo.user_id))
      {
        //即将展开聊天的用户信息
        $rootScope.chatUserInfo=$scope.applyUserInfo;
        $state.go('chat-detail',{chat_user_id: $scope.applyUserInfo.user_id});
      }
    };


});
