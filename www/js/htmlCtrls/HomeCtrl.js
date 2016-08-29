/**
 * Created by Administrator on 2016/4/7.
 */

rootModule.controller('HomeCtrl', function($scope,$state,NetworkStateService,$rootScope,$cordovaToast,$timeout,$ionicLoading,
                                           $ionicPlatform,LoginoutService,$http,ImgPathService) {

    var getHotTrade=function(){

        $scope.hotTradeError=false;
        $ionicLoading.show({
            templateUrl: 'templates/loading.html'
        });
        var $url='http://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Trade/getHotTradeList';
        $http({
            method: 'GET',
            url: $url
        }).
            success(function(data, status, headers, config)
            {
                switch (status)
                {
                    case 200:
                        console.log(data);
                        angular.fromJson(data);
                        ImgPathService.generateTradeListImgUrl(data);
                        $scope.hotTradeList=data;
                        //用户图像的实例化处理
                        break;
                }
            }).
            error(function(data, status, headers, config)
            {
                switch(status){
                    default:
                        $scope.hotTradeError=true;
                        console.log(status);
                        break;
                }
                $cordovaToast.showShortCenter("数据载入失败，请确认网络连接后重试");
            })
            .finally(function(){
                //读取画面停留一段时间，加强用户体验
                $timeout(function(){
                    $ionicLoading.hide();
                },$rootScope.LOADING_MIN_TIME);
            });
    };

    //获取热门商铺
    var getHotStore=function(){

        $scope.hotStoreError=false;
        $ionicLoading.show({
            templateUrl: 'templates/loading.html'
        });
        var $url='http://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Store/getHotStoreList';
        $http({
            method: 'GET',
            url: $url
        }).
            success(function(data, status, headers, config)
            {
                switch (status)
                {
                    case 200:
                        console.log(data);
                        angular.fromJson(data);
                        ImgPathService.generateStoreListImgUrl(data);
                        $scope.hotStoreList=data;
                        //用户图像的实例化处理
                        break;
                }
            }).
            error(function(data, status, headers, config)
            {
                switch(status){
                    default:
                        $scope.hotStoreError=true;
                        console.log(status);
                        break;
                }
                $cordovaToast.showShortCenter("数据载入失败，请确认网络连接后重试");
            })
            .finally(function(){
                //读取画面停留一段时间，加强用户体验
                $timeout(function(){
                    $ionicLoading.hide();
                },$rootScope.LOADING_MIN_TIME);
            });
    };


    $scope.hasMessage=true;
    $scope.onHomeSelect=function()
    {
        $state.go('tab.home');
    };

    //点击挂单
    $scope.onClickAddTrade=function()
    {
        if(LoginoutService.hasLogin())
        {
            $state.go("add-trade");
        }

    };

    //初始化关于出错的变量
    $scope.hotTradeError=false;
    $scope.hotStoreError=false;




    getHotTrade();
    getHotStore();

    $scope.onClickHotTrade=function($index){
        $rootScope.choosenItemInfo=$scope.hotTradeList[$index];
        $state.go("trade-detail");
    };

    $scope.onClickHotStore=function($index){
        $rootScope.choosenStoreInfo=$scope.hotStoreList[$index];
        $state.go('store-detail');
    };

    $scope.onRetry=function(type){
        switch (type)
        {
            case 'hot_trade':
                getHotTrade();
                break;
            case 'hot_store':
                getHotStore();
                break;
            default :
                break;
        }
    }


});