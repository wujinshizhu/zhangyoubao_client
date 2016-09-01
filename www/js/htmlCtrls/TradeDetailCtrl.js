/**
 * Created by wujin on 2015/11/5.
 * 该控制器对应商品细节页面的控制
 */


rootModule.controller('TradeDetailCtrl',function($scope,$stateParams,$rootScope,UserNameService, ImgPathService,
                                                 $ionicPopup,$http,$state,LocalInfoCache,$cordovaToast){

    $scope.getting_data=false;
    $scope.error_occur=false;
    //根据当前的tradeInfo获取其挂单人，挂单商铺等更多细节信息
    var getMoreDetailTradeInfo=function(){
        $scope.getting_data=true;
        $scope.error_occur=false;
        var params={
            trade_id: $scope.tradeInfo.trade_id,
            user_id: $scope.tradeInfo.user_id,
            store_id: $scope.tradeInfo.store_id
        };
        var $url='http://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Trade/getTradeDetail';
        $http({
            method: 'GET',
            url: $url,
            params: params
        }).
            success(function(data, status, headers, config)
            {
                switch (status)
                {
                    case 200:
                        console.log(data);
                        angular.fromJson(data);
                        ImgPathService.genUserAndStoreImgUrl(data, 'userInfo', 'storeInfo');
                        $scope.getting_data=false;
                        UserNameService.setUserNameRespect(data.userInfo);
                        $scope.userInfo=data.userInfo;
                        $scope.storeInfo=data.storeInfo;
                        saveDetailInfoToCache();
                        //用户图像的实例化处理
                        break;
                }
            }).
            error(function(data, status, headers, config)
            {
                switch(status){
                    default:
                        console.log(status);
                        $scope.getting_data=false;
                        $scope.error_occur=true;
                        break;
                }
            });
    };

    //用户点击刷新，获取数据
    //实验验证了该点击刷新系统的有效性
    $scope.onRetry=function()
    {
        $scope.getting_data=true;
        $scope.error_occur=false;
        getMoreDetailTradeInfo();

    };

    //获取传入的信息
    $scope.tradeInfo=$rootScope.choosenItemInfo;
    if($scope.tradeInfo==undefined)
    {
        console.log("传入数据为空")
    }
    else
    {
        console.log($scope.tradeInfo);
        var data=LocalInfoCache.getTradeInfo($scope.tradeInfo.trade_id);
        if(data!=null)
        {
            $scope.userInfo=data['userInfo'];
            $scope.storeInfo=data['storeInfo'];
        }
        else
        {
            getMoreDetailTradeInfo();
        }

    }

//    $scope.onApplyTrade=function(){
//        $ionicPopup.confirm({
//            title: '申请交易提示',
//            template: '请在洽谈成功后(本平台上私信洽谈或者电话洽谈)根据约定好的细节申请交易，只有双方都同意该交易申请，交易方可生效。',
//            cancelText: '取消',
//            okText: '确认申请'
//        }).then(function(result){
//            if(result){//点击确认
//            }
//            else{
//            }
//        });
//    };
    var isTradeFocused=function(trade_id)
    {
        //对于未登录的用户无法进行判断

        if(!$rootScope.isLogin)
        {
            return false;
        }
        if($rootScope.userInfo.focus_trade_ids)
        {
            return $rootScope.userInfo.focus_trade_ids.indexOf(trade_id)!=-1;
        }
        else
        {
            return false;
        }

    };



    var addTradeFocus= function ()
    {
        if(!$rootScope.isLogin)
        {
            $state.go('login');
            return;
        }
        if($rootScope.userInfo.focus_trade_ids && $rootScope.userInfo.focus_trade_ids.length>=$rootScope.MAX_FOCUS_NUMBER)
        {
            $cordovaToast.showShortCenter("超出挂单最大收藏数量，你可以在个人页面'我的收藏'功能中管理现有收藏");
            return;
        }
        if(!$scope.isFocused)
        {
            $scope.isFocused=true;
            var $url='https://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Focus/tradeFocus';
            $data={
                'user_id': $rootScope.userInfo.user_id,
                'trade_id': $scope.tradeInfo.trade_id
            };
            angular.toJson($data);
            $http({
                method: 'PUT',
                url: $url,
                data: $data
            }).
                success(function(data, status, headers, config)
                {
                    switch (status)
                    {
                        case 202:
                            $cordovaToast.showShortCenter("该商品已收藏");
                            break;
                        case 200:
                            $cordovaToast.showShortCenter("完成收藏");
                            if($rootScope.userInfo.focus_trade_ids)
                            {
                                $rootScope.userInfo.focus_trade_ids.push($scope.tradeInfo.trade_id);
                            }
                            else
                            {
                                $rootScope.userInfo.focus_trade_ids=[];
                                $rootScope.userInfo.focus_trade_ids[0]=$scope.tradeInfo.trade_id;
                            }

                            console.log($rootScope.userInfo.focus_trade_ids);
                            break;
                    }
                }).
                error(function(data, status, headers, config)
                {
                    switch(status){
                        case 400:
                            $cordovaToast.showShortCenter("传入参数错误");
                            break;
                        default:
                            $cordovaToast.showShortCenter("网络连接暂不可用");
                            break;
                    }
                    $scope.isFocused=false;
                });
        }
    };

    var cancelTradeFocus=function(){

        if($scope.isFocused)
        {
            $scope.isFocused=false;
            var $url='https://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Focus/cancelTradeFocus';
            $data={
                'user_id': $rootScope.userInfo.user_id,
                'trade_id': $scope.tradeInfo.trade_id
            };
            angular.toJson($data);
            $http({
                method: 'PUT',
                url: $url,
                data: $data
            }).
                success(function(data, status, headers, config)
                {
                    switch (status)
                    {
                        case 204:
                            $cordovaToast.showShortCenter("该商品未收藏");
                            break;
                        case 200:
                            $cordovaToast.showShortCenter("取消收藏");
                            var id=$rootScope.userInfo.focus_trade_ids.indexOf($scope.tradeInfo.trade_id);
                            $rootScope.userInfo.focus_trade_ids.splice(id,1);
                            console.log($rootScope.userInfo.focus_trade_ids);
                            break;
                    }
                }).
                error(function(data, status, headers, config)
                {
                    switch(status){
                        case 400:
                            $cordovaToast.showShortCenter("传入参数错误");
                            break;
                        default:
                            $cordovaToast.showShortCenter("网络连接暂不可用");
                            break;
                    }
                    $scope.isFocused=true;
                });
        }
    };

    $scope.isFocused=isTradeFocused($scope.tradeInfo.trade_id);
    $scope.changeFocused=function(){
      if($scope.isFocused){
          cancelTradeFocus();
      }else{
          addTradeFocus();
      }
    };

    //生成图片路径, 包括用户头像和用户对应的商铺信息的处理
//    var generateImgUrl=function(data)
//    {
//        if(data.userInfo.avatars_name==null)
//        {
//            data.userInfo.avatars_name="img/default_avatars.png"
//        }
//        else
//        {
//            data.userInfo.avatars_name="http://"+$rootScope.SERVER_ADDRESS+"/"+data.user_data.avatars_name;
//        }
//        if(data.storeInfo!=null)
//        {
//            data.storeInfo.store_img_cover="http://"+$rootScope.SERVER_ADDRESS+"/"+data.store_data.store_img_cover;
//            data.storeInfo.thumbnail_name="http://"+$rootScope.SERVER_ADDRESS+"/"+data.store_data.thumbnail_name;
//        }
//    };

    $scope.onStoreClicked=function()
    {
        $rootScope.choosenStoreInfo=$scope.storeInfo;
        $state.go('store-detail');
    };
    //将商品信息缓存到本地
    var saveDetailInfoToCache=function()
    {
        var data=[];
        data['tradeInfo']=$scope.tradeInfo;
        data['userInfo']=$scope.userInfo;
        data['storeInfo']=$scope.storeInfo;
        LocalInfoCache.saveTradeInfo($scope.tradeInfo.trade_id,data);
    };

    //当用户点击私信的时候，判断是否是自己
    $scope.onClickChat=function(){
      $rootScope.checkLogin();
      if(!$rootScope.detectIsSelf($scope.userInfo.user_id))
      {
          //即将展开聊天的用户信息
          $rootScope.chatUserInfo=$scope.userInfo;
          console.log($scope.userInfo);
          $state.go('chat-detail',{chat_user_id: $scope.userInfo.user_id});
      }
    };

    $scope.onClickApply=function(){
        $rootScope.checkLogin();
        if(!$rootScope.detectIsSelf($scope.userInfo.user_id) && $rootScope.isCertified()) {
            //进行申请的挂单信息
            $rootScope.tradeApplyInfo=$scope.tradeInfo;
            console.log('clicked');
            $state.go('transaction-apply');
        }
    };





});
