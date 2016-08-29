/**
 * Created by Administrator on 2016/4/23.
 */


rootModule.controller('SearchCtrl', function($scope,$rootScope,$http,$cordovaToast,$state,
                                             $timeout,$ionicLoading,ImgPathService) {




    var QUERY_TYPES={
        TRADE: 0,
        STORE: 1
    };

    //处理返回的日期信息
    //20120101  => 2010-01-01
    var processListDate=function(list)
    {
        for(var i=0;i<list.length;i++)
        {
            var year=list[i].create_time.substr(0,4);
            var month=list[i].create_time.substr(4,2);
            var day=list[i].create_time.substr(6,2);
            list[i].create_time=year+"-"+month+"-"+day;
        }
    };



    $scope.query_type_array=[{
        id: QUERY_TYPES.TRADE,
        name: '挂单'
    },{
        id: QUERY_TYPES.STORE,
        name: '商铺'
    }
    ];


    $scope.sort_type_array=[{
        id: $rootScope.SORT_TYPE.RELEVANCE,
        name: '相关性排序'
    },{
        id: $rootScope.SORT_TYPE.TIME,
        name: '时间排序'
    },{
        id: $rootScope.SORT_TYPE.VISIT,
        name: '访问量排序'
    }
    ];


    //用户查询语句
    $scope.query={
        content: null,
        type: QUERY_TYPES.TRADE,
        sort_type: $rootScope.SORT_TYPE.RELEVANCE
    };
    //标记是否获得搜索结果
    $scope.gotSearchResult=false;
    $scope.store_list=[];
    $scope.trade_list=[];
    //记录上一次搜索的关键词，用于获取更多数据和改变排序
    $scope.lastSearch=null;
    //是否有更多匹配的信息
    $scope.noMoreData=false;
    //是否完全没有找到信息
    $scope.noDataMatch=false;
    //根据输入参数进行搜索
    var onSearch=function(query){
        $scope.corrected=null;
        $scope.noDataMatch=false;
        $ionicLoading.show({
            templateUrl: 'templates/loading.html'
        });
        var $url=null;
        switch (query.type)
        {
            case QUERY_TYPES.TRADE:
                $url='http://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Search/searchTrade';
                break;
            case QUERY_TYPES.STORE:
                $url='http://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Search/searchStore';
                break;
        }
        $http({
            method: 'GET',
            url: $url,
            params: query
        }).
            success(function(data, status, headers, config)
            {

                console.log(status);
                switch (status)
                {
                    case 200:
                        angular.fromJson(data);
                        console.log(data);
                        if(data.trade_list)
                        {
                            ImgPathService.generateTradeListImgUrl(data.trade_list);
                            processListDate(data.trade_list);
                            //用于区分是否是获取更多数据
                            if(data.last_length)
                            {
                                $scope.trade_list=$scope.trade_list.concat(data.trade_list);
                            }
                            else
                            {
                                $scope.trade_list=data.trade_list;
                                $scope.store_list=[];
                            }
                            if(data.trade_list.length<$rootScope.GET_SEARCH_NUM)
                            {
                                $scope.noMoreData=true;
                            }
                        }
                        else if(data.store_list)
                        {
                            ImgPathService.generateStoreListImgUrl(data.store_list);
                            processListDate(data.store_list);
                            if(data.last_length)
                            {
                                $scope.store_list=$scope.store_list.concat(data.store_list);
                            }
                            else
                            {
                                $scope.store_list=data.store_list;
                                $scope.trade_list=[];
                            }
                            if(data.store_list.length<$rootScope.GET_SEARCH_NUM)
                            {
                                $scope.noMoreData=true;
                            }

                        }
                        $scope.gotSearchResult=true;
                        $ionicScrollDelegate.resize();
                        break;
                    case 202:
                        console.log(data);
                        //确认不是因为继续获取而找不到信息
                        if(!data.last_length)
                        {
                            $cordovaToast.showShortCenter("找不到和输入内容相符的信息");
                            $scope.noDataMatch=true;
                            //是否对于用户的搜索输入给出了建议
                            if(data.corrected)
                            {
                                $scope.corrected=data.corrected;
                            }
                            $scope.store_list=[];
                            $scope.trade_list=[];
                            $scope.gotSearchResult=false;
                        }
                        else
                        {
                            //如果是继续获取得不到信息，基本不需要更多处理
                            $scope.noMoreData=true;
                        }



                        break;
                }

            }).
            error(function(data, status, headers, config)
            {
                $scope.gotSearchResult=false;
                switch(status){
                    default:
                        console.log(status);
                        $cordovaToast.showShortCenter("数据获取失败，请检查网络状态后重试");
                        break;
                }
            }).
            finally(function(){
                $timeout(function(){
                    $ionicLoading.hide();
                },$rootScope.LOADING_MIN_TIME);
            });

    };

    //用户点击搜索键
    $scope.onClickSearch=function()
    {
        //开始一次新的查询
        $scope.noMoreData=false;
        if(!$scope.query.content)
        {
            $cordovaToast.showShortCenter("请输入搜索内容");
            return;
        }
        $scope.lastSearch=angular.copy($scope.query);
        onSearch($scope.query);
    };
    //搜索推荐，每次用户输入
    $scope.searchRecommand=function(){
//        console.log($scope.query);
    };
    //搜索结果排序改变
    $scope.onSortTypeChange=function(newValue,oldValue){
        if($scope.gotSearchResult)
        {
            $scope.noMoreData=false;
            $scope.lastSearch.sort_type=$scope.query.sort_type;
            onSearch($scope.lastSearch);
            $ionicScrollDelegate.scrollTop();
        }
    };

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

    //获取更多搜索信息
    $scope.getMoreSearchResult=function()
    {
        if(!$scope.noMoreData)
        {
            var query=angular.copy($scope.lastSearch);
            //获取当前已有的数据信息
            query.current_length=$scope.store_list.length | $scope.trade_list.length;
            onSearch(query);
        }
    };

    $scope.onClickCorrected=function(index)
    {
        $scope.query.content=$scope.corrected[index];
        onSearch($scope.query);
    };

});