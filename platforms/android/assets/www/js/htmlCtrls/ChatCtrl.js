/**
 * Created by wujin on 2015/10/21.
 * 私信内容的控制器
 */
rootModule.controller('ChatsCtrl', function($scope, Chats,$ImageCacheFactory,$rootScope,$state,$ionicListDelegate,
                                            SocketService,ChatCacheService,$cordovaToast) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //
    //$scope.$on('$ionicView.enter', function(e) {
    //});
    $scope.chatsDic={};
    $scope.chatOrderList=[];
    //检测是否登录，对于没有登录的，强制进行登录
    $scope.$on('$ionicView.beforeEnter',function(){
        $rootScope.checkLogin();
        //每次进来都刷新一下聊天数据
        $scope.chatsDic=ChatCacheService.getChatDic();
        $scope.chatOrderList=ChatCacheService.getChatOrderList();

    });

    //所有的数据请求操作都需要在登录之后进行获取


    //$scope.chats = Chats.all();
//    $scope.remove = function(chat) {
//        Chats.remove(chat);
//    };
    //该部分代码用于图片缓存。当从服务器端获取用户图片后，将其缓存下来
    //在真正功能实现时，每次从服务器端获取用户头像时都调用该函数进行缓存，该功能只用于这种从列表到子目录的形式
    //对于商品页面的图像，不用缓存
    //记住要缓存用户自己的头像，这一点在用户登录时就可以实现
//    $ImageCacheFactory.Cache(["img/touxiang4.jpg","img/touxiang5.jpg"])
//        .then(function(){
//            console.log("Images done loading!");
//        },function(failed){
//            console.log("An image filed: "+failed);
//        });


    //监控登录的状态
    $scope.isConnected=SocketService.isConnected();

    $scope.$watch(function(){
        return SocketService.isConnected();
    },function(newValue){
        console.log(newValue);
        $scope.isConnected=newValue;
    });


    $scope.isChatEmpty=function(){
        for (var key in $scope.chatsDic) {
            return false;
        }
        return true;
    };

    //$scope.chats=ChatCacheService.getChatCache();

    $scope.goChatDetail=function(key){
        if(key == $rootScope.SYSTEM_MSG_ID) {
          $state.go('system-msg-list');
        }
        else{
          //即将展开聊天的用户信息
          $rootScope.chatUserInfo=$scope.chatsDic[key].userInfo;
          $state.go('chat-detail',{chat_user_id: $scope.chatsDic[key].userInfo.user_id});
        }

    };


    //删除与目标用户的聊天记录
    $scope.removeChat=function(user_id){
        ChatCacheService.clearChatCacheOfTarget(user_id);
        if($scope.isChatEmpty())
        {
            //当不存在聊天记录时自动将delete隐藏
            if($scope.edit_delete)
            {
                $ionicListDelegate.showDelete($scope.edit_delete=!$scope.edit_delete);
            }
        }
    };

    $scope.edit_delete=false;
    //改变显示删除栏的显示状态
    $scope.onEdit=function(){
        if($scope.isChatEmpty())
        {
            $cordovaToast.showShortCenter("暂无可编辑的聊天记录");
            return;
        }

        $ionicListDelegate.showDelete($scope.edit_delete=!$scope.edit_delete);
    }





});
