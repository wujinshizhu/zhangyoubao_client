/**
 * Created by Administrator on 2016/4/19.
 */


rootModule.controller('FocusManageCtrl', function($scope,$rootScope,$ionicScrollDelegate,$timeout,$cordovaToast,
                                                  ImgPathService,$http,$state,$ionicPopup,$ionicLoading) {

    $scope.focus_store_ids=angular.copy($rootScope.userInfo.focus_store_ids);
    $scope.focus_trade_ids=angular.copy($rootScope.userInfo.focus_trade_ids);
    $scope.isEmpty=false;

    if(!$scope.focus_store_ids && !$scope.focus_trade_ids)
    {
        $scope.isEmpty=true;
    }

    //获取收藏商铺和商品的信息
    $scope.trade_list=null;
    $scope.store_list=null;

    $scope.error_occur=false;

    var getFocusedData=function(){

        $scope.error_occur=false;
        $ionicLoading.show({
            templateUrl: 'templates/loading.html'
        });
        //get 请求中无法传递数组，所以将数组转化为字符串发送
        if($scope.focus_store_ids!=null)
        {
            $focus_store_id_str=$scope.focus_store_ids.join(',');
        }
        else
        {
            $focus_store_id_str=null;
        }
        if($scope.focus_trade_ids!=null)
        {
            $focus_trade_id_str=$scope.focus_trade_ids.join(',');
        }
        else
        {
            $focus_trade_id_str=null;
        }


        var params={
            focus_store_ids: $focus_store_id_str,
            focus_trade_ids: $focus_trade_id_str
        };
        var $url='http://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Focus/getFocusedItemData';
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
                        if(data.trade_list)
                        {
                            $scope.trade_list=data.trade_list;
                            ImgPathService.generateTradeListImgUrl($scope.trade_list);
                        }
                        if(data.store_list)
                        {
                            $scope.store_list=data.store_list;
                            ImgPathService.generateStoreListImgUrl($scope.store_list);
                        }
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
    //获取数据
    if(!$scope.isEmpty)
    {
        getFocusedData();
    }


    $scope.onChooseItem=function(type,$index){
        if(type=='trade')
        {
            $rootScope.choosenItemInfo=$scope.trade_list[$index];
            $state.go("trade-detail");
        }
        else if(type=='store')
        {
            $rootScope.choosenStoreInfo=$scope.store_list[$index];
            $state.go('store-detail');
        }
    };

    $scope.show_delete_state=false;

    $scope.deleteFocus=function(type,index){
        if(type=='trade')
        {
            cancelTradeFocus(index);
        }
        else if(type=='store')
        {
            cancelStoreFocus(index);
        }
    };

    //清空数据
    $scope.clearData=function(){
        $ionicPopup.confirm({
            title: '清空收藏',
            template: '您是否确认清空所有收藏数据，数据清空后不可恢复',
            cancelText: '取消操作',
            okText: '确认清空'
        }).then(function(result){
            if(result){
                clearAllFocus();
            }
        });
    };
    //数据访问错误后的重试
    $scope.onRetry=function(){
        $scope.error_occur=false;
        if(!$scope.isEmpty)
        {
            getFocusedData();
        }
    };

    //下拉刷新
    $scope.getLatestData=function(){
        if(!$rootScope.userInfo.focus_trade_ids && !$rootScope.userInfo.focus_store_ids)
        {
            $cordovaToast.showShortCenter("当前已是最新数据");
            $scope.$broadcast('scroll.refreshComplete');
            return;
        }
        var newFocusTradeStr=calculateIdsNeedGet($scope.focus_trade_ids,$rootScope.userInfo.focus_trade_ids,$scope.trade_list);
        var newFocusStoreStr=calculateIdsNeedGet($scope.focus_store_ids,$rootScope.userInfo.focus_store_ids,$scope.store_list);
        var params={
            focus_trade_ids: newFocusTradeStr,
            focus_store_ids: newFocusStoreStr
        };
        if(newFocusTradeStr==null && newFocusStoreStr==null)
        {
            $cordovaToast.showShortCenter("当前已是最新数据");
            $scope.$broadcast('scroll.refreshComplete');
            return;
        }

        var $url='http://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Focus/getFocusedItemData';
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
                        angular.fromJson(data);
                        console.log(data);
                        $scope.isEmpty=false;
                        if(data.trade_list!=null)
                        {
                            ImgPathService.generateTradeListImgUrl(data.trade_list);
                            if($scope.trade_list)
                            {
                                $scope.trade_list=$scope.trade_list.concat(data.trade_list);
                            }
                            else
                            {
                                $scope.trade_list=data.trade_list;
                            }

                            for(var i=0;i<data.trade_list.length;i++)
                            {
                                $scope.focus_trade_ids.push(data.trade_list[i].trade_id);
                            }
                        }
                        if(data.store_list!=null)
                        {
                            ImgPathService.generateStoreListImgUrl(data.store_list);
                            if($scope.store_list)
                            {
                                $scope.store_list=$scope.store_list.concat(data.store_list);
                            }
                            else
                            {
                                $scope.store_list=data.store_list;
                            }

                            for(var j=0;j<data.store_list.length;j++)
                            {
                                $scope.focus_store_ids.push(data.store_list[j].store_id);
                            }
                        }
                        $ionicScrollDelegate.resize();
                        $cordovaToast.showShortCenter("更新成功");
                        break;
                }


            }).
            error(function(data, status, headers, config)
            {
                switch(status){
                    default:
                        console.log(status);
                        $cordovaToast.showShortCenter("更新数据失败，请检查网络状态后重试");
                        break;
                }
            }).
            finally(function(){
                $scope.$broadcast('scroll.refreshComplete');
            });

    };


    /**
     * 计算需要从服务器端获取信息的ID
     * @param old_ids array 原本页面中包含的ID
     * @param new_ids array 当前最新的ID
     * @param old_list array 原本页面中的数据项
     * @return array|null 返回的数据项
     */
    var calculateIdsNeedGet=function(old_ids,new_ids,old_list)
    {
        var newFocusStr=null;
        if(!old_ids)
        {
            newFocusStr=new_ids.join(',');
            return newFocusStr;
        }
        if(!new_ids)
        {
            old_ids=new_ids;
            old_list=[];
            return null;
        }

        //将当前的trade_list和最新的trade_ids进行对比
        //1.去除掉trade_list中存在而trade_ids中不存在的,即去掉用户已经取消收藏的
        for(var i=0;i<old_ids.length;i++)
        {
            if(new_ids.indexOf(old_ids[i])==-1)
            {
                old_ids.splice(i,1);
                old_list.splice(i,1);
                i--;
            }
        }


        //2.统计new_ids中存在而trade_list中不存在的，即统计用户新收藏的
        var newFocus=[];
        if(old_ids.length==new_ids.length)
        {
            //两个列表长度相同，认为两者完全一样，没有新关注的
            $scope.$broadcast('scroll.refreshComplete');
            return null;
        }
        else
        {
            for(i=0;i<new_ids.length;i++)
            {
                if(old_ids.indexOf(new_ids[i])==-1)
                {
                    newFocus.push(new_ids[i]);
                }
            }
            console.log(newFocus);
        }

        if(newFocus.length>=1)
        {
            newFocusStr=newFocus.join(',');
        }
        return newFocusStr;
    };

    /**
     * 为了避免对于数据连接结果的侦听，此处采用了与tradeDetail页面中几乎完全相同的代码，存在代码重复
     */
    var cancelTradeFocus=function(index){
        var $url='https://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Focus/cancelTradeFocus';
        $data={
            'user_id': $rootScope.userInfo.user_id,
            'trade_id': $scope.trade_list[index].trade_id
        };
        angular.toJson($data);
        $http({
            method: 'POST',
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
                        var id=$rootScope.userInfo.focus_trade_ids.indexOf($scope.trade_list[index].trade_id);
                        $rootScope.userInfo.focus_trade_ids.splice(id,1);
                        id=$scope.focus_trade_ids.indexOf($scope.trade_list[index].trade_id);
                        $scope.focus_trade_ids.splice(id,1);
                        $scope.trade_list.splice(index,1);
                        $ionicScrollDelegate.resize();
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
                        $cordovaToast.showShortCenter("取消收藏失败，请检查网络状态后重试");
                        break;
                }
            });
    };
    //取消商铺收藏
    var cancelStoreFocus=function(index){

        var $url='https://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Focus/cancelStoreFocus';
        $data={
            'user_id': $rootScope.userInfo.user_id,
            'store_id': $scope.store_list[index].store_id
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
                        var id=$rootScope.userInfo.focus_store_ids.indexOf($scope.store_list[index].store_id);
                        $rootScope.userInfo.focus_store_ids.splice(id,1);
                        id=$scope.focus_store_ids.indexOf($scope.store_list[index].store_id);
                        $scope.focus_store_ids.splice(id,1);
                        $scope.store_list.splice(index,1);
                        $ionicScrollDelegate.resize();
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
                        $cordovaToast.showShortCenter("取消收藏失败，请检查网络状态后重试");
                        break;
                }
            });

    };


    var clearAllFocus=function(index){
        var $url='https://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Focus/clearAllFocus';
        $data={
            'user_id': $rootScope.userInfo.user_id
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

                    case 200:
                        $cordovaToast.showShortCenter("收藏列表已清空");
                        $scope.trade_list=[];
                        $scope.store_list=[];
                        $scope.focus_store_ids=[];
                        $scope.focus_trade_ids=[];
                        $scope.isEmpty=true;
                        $rootScope.userInfo.focus_trade_ids=null;
                        $rootScope.userInfo.focus_store_ids=null;
                        $ionicScrollDelegate.resize();
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
                        $cordovaToast.showShortCenter("清空失败，请检查网络状态后重试");
                        break;
                }
            });
    };
    //1.删除
    //2.清空
    //3.读取中，重试
    //4.下拉更新

});
