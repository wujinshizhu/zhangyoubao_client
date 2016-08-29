/**
 * Created by wujin on 2015/11/9.】
 * 用于实体店铺的展示
 */


rootModule.controller('StoreDetailCtrl',function($scope,$stateParams,$ionicScrollDelegate,$rootScope,$ionicLoading,$http,LocalInfoCache,
                                                $location,$state, $anchorScroll,$ionicHistory,ImgPathService,$cordovaToast,$timeout){
//    $scope.shopId=$stateParams.shopId;
//    $scope.classes=[{
//        name: '版张专区',
//        isOpen: false
//    },{
//        name: '版票专区',
//        isOpen: false
//    }];
//
//    $scope.changeOpen=function(changedClass){
//        changedClass.isOpen=!changedClass.isOpen;
//
//        //重新计算页面大小
//        $ionicScrollDelegate.resize();
//        if(changedClass.isOpen){
//            $ionicScrollDelegate.scrollBy(0, 100,true);
//        }
//        //anchorScroll这套方案被否决，当多次跳跃时会出现各种问题，现在索性在展开时向下跳100个像素点
//    };
//
//    $scope.classItems=new Array();
//
//    $scope.classItems['版票专区']=[{
//
//        title: '收购2011辛亥革命小版',
//        tradeType: 0,   //交易类型 0是收购，1 是出售
//        price: 38,
//        unit: '版'
//    },{
//        title: '出售船舶。包公。鸳鸯小版。',
//        tradeType: 1,   //交易类型 0是收购，1 是出售
//        price: 50,
//        unit: '版'
//    }];
//
//    $scope.classItems['版张专区']=[{
//        title: '收购2011辛亥革命小版',
//        tradeType: 0,   //交易类型 0是收购，1 是出售
//        price: 38,
//        unit: '版'
//    },{
//        title: '出售船舶。包公。鸳鸯小版。',
//        tradeType: 1,   //交易类型 0是收购，1 是出售
//        price: 50,
//        unit: '版'
//    }];
//
//
//    $scope.isCollected=false;
//    $scope.changeCollect=function(){
//        $scope.isCollected=!$scope.isCollected;
//        if($scope.isCollected){
//          window.plugins.toast.showShortBottom("完成收藏");
//        }else{
//          window.plugins.toast.showShortBottom("取消收藏");
//        }
//    };


    var isStoreFocused=function(store_id)
    {
        if(!$rootScope.isLogin)
        {
            return false;
        }
        if($rootScope.userInfo.focus_store_ids)
        {
            return $rootScope.userInfo.focus_store_ids.indexOf(store_id)!=-1;
        }
        else
        {
            return false;
        }

    };
    var getTradeListOfStore=function(){
        var params={
            store_id: $scope.storeInfo.store_id
        };
        $scope.error_occur=false;
        $ionicLoading.show({
            template: '' +'<ion-spinner></ion-spinner>'+
                '数据加载中...'
        });
        var $url='http://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Store/getTradeListOfStore';
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
                        //获取商品列表
                        angular.fromJson(data);
                        console.log(data);
                        $scope.trade_list=data;
                        ImgPathService.generateTradeListImgUrl($scope.trade_list);
                        saveDetailInfoToCache();
                        $ionicScrollDelegate.resize();
                        break;
                    case 204:
                        break;

                }
            }).
            error(function(data, status, headers, config)
            {
                switch(status){
                    default:
                        console.log(status);
                        $scope.error_occur=true;
                        break;
                }
            })
            .finally(function(){

                //读取画面停留一段时间，加强用户体验
                $timeout(function(){
                    $ionicLoading.hide();
                },$rootScope.LOADING_MIN_TIME);


            });
    };

    //
    var addStoreFocus=function(){
        if(!$rootScope.isLogin)
        {
            $state.go('login');
            return;
        }
        if($rootScope.userInfo.focus_store_ids && $rootScope.userInfo.focus_store_ids.length>=$rootScope.MAX_FOCUS_NUMBER)
        {
            $cordovaToast.showShortCenter("超出挂单最大收藏数量，你可以在个人页面'我的收藏'功能中管理现有收藏");
            return;
        }
        if(!$scope.isFocused)
        {
            $scope.isFocused=true;
            var $url='https://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Focus/storeFocus';
            $data={
                'user_id': $rootScope.userInfo.user_id,
                'store_id': $scope.storeInfo.store_id
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
                            $cordovaToast.showShortCenter("该商铺已收藏");
                            break;
                        case 200:
                            $cordovaToast.showShortCenter("完成收藏");
                            if($rootScope.userInfo.focus_store_ids)
                            {
                                $rootScope.userInfo.focus_store_ids.push($scope.storeInfo.store_id);
                            }
                            else
                            {
                                $rootScope.userInfo.focus_store_ids=[];
                                $rootScope.userInfo.focus_store_ids[0]=$scope.storeInfo.store_id;
                            }

                            console.log($rootScope.userInfo.focus_store_ids);
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

    var cancelStoreFocus=function(){
        if($scope.isFocused)
        {
            $scope.isFocused=false;
            var $url='https://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Focus/cancelStoreFocus';
            $data={
                'user_id': $rootScope.userInfo.user_id,
                'store_id': $scope.storeInfo.store_id
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
                            $cordovaToast.showShortCenter("该商铺未收藏");
                            break;
                        case 200:
                            $cordovaToast.showShortCenter("取消收藏");
                            var id=$rootScope.userInfo.focus_store_ids.indexOf($scope.storeInfo.store_id);
                            $rootScope.userInfo.focus_store_ids.splice(id,1);
                            console.log($rootScope.userInfo.focus_store_ids);
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

    //将商品信息缓存到本地
    var saveDetailInfoToCache=function()
    {
        var data=[];
        data['trade_list']=$scope.trade_list;
        LocalInfoCache.saveStoreInfo($scope.storeInfo.store_id,data);
    };



    //获取商铺信息
    //获取传入的信息
    $scope.storeInfo=$rootScope.choosenStoreInfo;
    $scope.userInfo=$rootScope.choosenStoreUserInfo;
    if($scope.storeInfo==undefined)
    {
        console.log("传入数据为空");
        $ionicHistory.goBack();
    }
    else
    {
        console.log($scope.storeInfo);
        //先尝试从缓存中读取
        var data=LocalInfoCache.getStoreInfo($scope.storeInfo.store_id);
        if(data!=null)
        {
            $scope.trade_list=data['trade_list'];
        }
        else
        {
            getTradeListOfStore();
        }
    }

    $scope.error_occur=false;
    $scope.isFocused=isStoreFocused($scope.storeInfo.store_id);

    $scope.changeFocused=function(){
        if($scope.isFocused){
            cancelStoreFocus();
        }else{
            addStoreFocus();
        }
    };

    //数据访问错误后的重试
    $scope.onRetry=function(){
        getTradeListOfStore();
    };

    $scope.onChooseItem=function(index){
        $rootScope.choosenItemInfo=$scope.trade_list[index];
        $state.go("trade-detail");

    };

    //挂单列表展示的代码复用
    $scope.trade_list_show_url="templates/trade-list-show.html";
    //收藏，取消收藏
    //数据缓存
    //热门商铺，最近一小时

});
