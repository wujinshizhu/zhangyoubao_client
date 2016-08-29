/**
 * Created by wujin on 2015/10/19.
 * 用于专区页面的控制器
 */
rootModule.controller('CategoryCtrl',function($scope,$window,$http,$state,$ionicSideMenuDelegate,$ionicPlatform,$ionicTabsDelegate,ImgPathService,
                                              $ionicScrollDelegate,$rootScope,$timeout,TradeTypeService,$cordovaToast,$ionicLoading) {
//    $scope.isClicked=[true,false,false,false];
//    $scope.subTitles=['邮票','钱币','卡片','大宗'];
//    //各个标题对应的分区
//    //注：关于分区是写死还是每次打开时查看是否有更新，无更新就按照当前存储的分区来，有新分区就获取新的分区资料，即分区是固定不变的还是需要按需变化的
//    $scope.Topics=new Array();
//    $scope.Topics[0]=['版张专区','版票专区','小型张/小全张','小本票/大本册','纪特文编JT新票','纪特文编JT销封','邮票片JP','JF封/其他封','邮资片TP/YP/FP','普封普片','贺年封片简卡','港澳邮票','个性化原票','普区民清加改欠外','年册/集邮工具','产品票/礼品册'];
//    $scope.Topics[1]=['现代金银贵金属币','流通纪念币','一二三版纸币','古币/银元','联体钞/纪念钞','港澳台钱币','清朝/民国纸币','贵金属/纪念章'];
//    $scope.Topics[2]=['卡片测试1','卡片测试2'];
//    $scope.Topics[3]=['全部'];

    //关于获取数据排序类型的定义
    $scope.sort_type_array=[
    {
        id: $rootScope.SORT_TYPE.TIME,
        name: '时间排序'
    },{
        id: $rootScope.SORT_TYPE.VISIT,
        name: '访问量排序'
    }
    ];
    //默认按时间进行排序
    $scope.sort_option={
        sort_type: $rootScope.SORT_TYPE.TIME
        };

    //当改变商品列表的排序类型时
    $scope.onSortTypeChange=function(){
        $scope.trade_list=null;
        last_id=-1;
        getTradeList();
        $ionicScrollDelegate.scrollTop();
    };


    $scope.item_types=TradeTypeService.getItemType();
    $scope.item_subtypes=TradeTypeService.getItemSubtype();

    //考虑类型列表获取失败的情况
    if($scope.item_subtypes==null)
    {
        //表明获取数据失败，显示刷新的页面
        $scope.getting_data=false;
        $scope.error_occur=true;
        $scope.currSubTypes=null;
        $ionicScrollDelegate.resize();
    }
    else
    {
        $scope.currSubTypes=$scope.item_subtypes[0];
    }

    //用户点击刷新，获取数据
    //实验验证了该点击刷新系统的有效性
    $scope.onRetry=function()
    {
        $scope.getting_data=true;
        $scope.error_occur=false;
        if($scope.item_subtypes!=null)
        {
            //挂单列表获取失败
            $scope.getMoreTradeInfo();
        }
        else //类型数据获取失败
        {
            TradeTypeService.getItemSubtypesFromServer();
            //监控是否获取成功
            var itemTypeSuccessWatcher=$scope.$watch(function() {
                return TradeTypeService.getItemSubtype();
            }, function(value) {
                //用于监控用户手动左划关闭侧边栏的情况
                if(value!=null)
                {
                    //获取成功
                    $scope.getting_data=false;
                    $scope.error_occur=false;
                    $scope.item_subtypes=TradeTypeService.getItemSubtype();
                    //获取当前的详细分区数据
                    var selectedIndex=$ionicTabsDelegate.$getByHandle('itemTypeTabs').selectedIndex();
                    $scope.currSubTypes=$scope.item_subtypes[selectedIndex];
                    //刷新页面
                    $ionicScrollDelegate.resize();
                    //获取当前数据
                    $scope.getMoreTradeInfo();
                    itemTypeSuccessWatcher();//撤销监控
                    itemTypeFailWatcher();
                }
            });
            var itemTypeFailWatcher=$scope.$watch(function() {
                return TradeTypeService.ifGetDataFail();
            }, function(value) {
                //用于监控用户手动左划关闭侧边栏的情况
                if(value)
                {
                    //确认获取type失败
                    if(TradeTypeService.getItemSubtype()==null)
                    {
                        $scope.getting_data=false;
                        $scope.error_occur=true;
                    }
                    //停止监控
                    itemTypeFailWatcher();
                    itemTypeSuccessWatcher();

                }
            });
        }

    };


    //用于监控当前的页面的宽度，并且在宽度变化时重新刷新页面
    //注意： 必须通过function返回$window.innerWidth的方式进行监控，直接监控$window.innerWidth并没有用
    //在实际使用中并不一定有用
    $scope.$watch(function()
    {
        return $window.innerWidth;
    },function(newValue, oldValue)
    {
        if(newValue!=oldValue)
        {
            $window.location.reload(true);
        }
    });
    //默认选择第一个,进入界面后默认加载第一个选项的数据，其他的加载在用户点击subtitle和topic时触发
    //点击subtitle，默认加载该子标题下的第一个topic，其他在点击topic时触发
//    $timeout(function(){
//            $ionicTabsDelegate.$getByHandle('itemTypeTabs').select(0);
//        },100
//    );

    //用watch监控一个函数的返回值，很有用的范例
    $scope.$watch(function() {
        return $ionicSideMenuDelegate.isOpenLeft();
    }, function(value) {
        //用于监控用户手动左划关闭侧边栏的情况
        console.log(value);
        //do something
    });


    $scope.sideMenuWidth=$window.innerWidth/3;
    $scope.OnTypeTabClick=function(index)
    {
        $ionicSideMenuDelegate.toggleLeft(true);
        $ionicTabsDelegate.$getByHandle('itemTypeTabs').select(index);
        if($scope.item_subtypes!=null)
        {
            $scope.currSubTypes=$scope.item_subtypes[index];
            $scope.subTypeChosen=0;
            last_id=-1;
            $scope.trade_list=null;
            $scope.getMoreTradeInfo();
            //$ionicScrollDelegate.scrollTop();
        }
        else
        {
            //在获取分区数据失败时


        }



    };


    $scope.OnSubTypeClick=function(index)
    {
        $scope.subTypeChosen=index;
        $scope.trade_list=null;
        last_id=-1;
        getTradeList();
        $ionicSideMenuDelegate.toggleLeft(false);
        //重置页面布局
        $ionicScrollDelegate.scrollTop();

        //$ionicScrollDelegate.resize();
    };
    //控制侧边栏的显示
    $scope.onChangeSideMenu=function(){
        if($ionicSideMenuDelegate.isOpenLeft()){
            $ionicSideMenuDelegate.toggleLeft(false);
        }else{
            $ionicSideMenuDelegate.toggleLeft(true);
        }
    };

    $timeout(function() {
        $ionicTabsDelegate.$getByHandle('itemTypeTabs').select(0);
        //当前选择的子分区
        $scope.subTypeChosen=0;
        //表明该类型的数据是否已经全部获取
        $scope.noMoreData=false;
        $scope.getMoreTradeInfo();
    }, 100);

    //上一次获取的信息的最后一个商品的id，用于分页获取信息，当用户选择不同的分区，该值置为0
    var last_id=-1;
    //用于表示是否正在运行，防止连续两次调用
    $scope.infiniteScollRunning=false;
    //根据当前的类型信息获取订单信息
    var getTradeList=function(){
        $scope.infiniteScollRunning=true;
        $scope.noMoreData=false;

        if($scope.noMoreData)
        {
            $cordovaToast.showShortCenter("该分区暂无更多挂单");
            return;
        }
        if(last_id==-1)
        {
            $scope.getting_data=true;
        }

        var params={
            last_id: last_id,
            item_type: $ionicTabsDelegate.$getByHandle('itemTypeTabs').selectedIndex(),
            item_subtype: $scope.subTypeChosen
        };
        console.log(params);
        $ionicLoading.show({
            templateUrl: 'templates/loading.html'
        });
        var url=null;
        if($scope.sort_option.sort_type==$rootScope.SORT_TYPE.TIME)
        {
            url='http://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Trade/getTradeListByTime';
        }
        else if($scope.sort_option.sort_type==$rootScope.SORT_TYPE.VISIT)
        {
            url='http://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Trade/getTradeListByVisitNum';
        }
        else
        {
            console.log('获取数据的排序类型出错');
            return;
        }

        $http({
            method: 'GET',
            url: url,
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
                        //generateImgUrl(data);
                        ImgPathService.generateTradeListImgUrl(data);
                        //初次获取该类的值
                        if(last_id==-1)
                        {
                            $scope.trade_list=data;
                        }
                        else
                        {
                            //合并两次的数据
                            $scope.trade_list=$scope.trade_list.concat(data);
                        }
                        $scope.getting_data=false;
                        last_id=$scope.trade_list[$scope.trade_list.length-1].trade_id;
                        console.log(last_id);
                        if(data.length<$rootScope.GET_LIST_NUM)
                        {
                            //这个类型的商品都没了
                            $scope.noMoreData=true;
                        }

                        $ionicScrollDelegate.resize();
                        break;
                    case 204:
                        console.log("没有更多该类型的数据");
                        $scope.noMoreData=true;
                        $scope.getting_data=false;
                        //没有更多该类型的数据
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
            })
            .finally(function(){
                $scope.getting_data=false;
                if($scope.onRefresh)
                {
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.onRefresh=false;
                }
                $timeout(function(){
                    $ionicLoading.hide();
                },$rootScope.LOADING_MIN_TIME);


            });
    };

    //生成图片路径
//    var generateImgUrl=function(data)
//    {
//        for($i=0;$i<data.length;$i++)
//        {
//            if(data[$i].thumbnail_name!=null)
//            {
//                data[$i].thumbnail_name="http://"+$rootScope.SERVER_ADDRESS+"/"+data[$i].thumbnail_name;
//            }
//            if(data[$i].img_names!=null)
//            {
//                data[$i].img_names=data[$i].img_names.split(',');
//                for($j=0;$j<data[$i].img_names.length;$j++)
//                {
//                    data[$i].img_names[$j]="http://"+$rootScope.SERVER_ADDRESS+"/"+data[$i].img_names[$j];
//                }
//            }
//        }
//
//    };
    //获取更多的数据信息
    $scope.getMoreTradeInfo=function(){
        $scope.getting_data=true;
        getTradeList();

    };

    $scope.onChooseItem=function($index){
        $rootScope.choosenItemInfo=$scope.trade_list[$index];
        $state.go("trade-detail");

    };
    //用于标记当前是否在刷新过程中，用于scroll.refreshComplete消息的广播
    $scope.onRefresh=false;
    //下拉更新
    $scope.getLatestData=function()
    {
        //当基于访问量的刷新时，直接重新获取一次数据，和改变排序规则时的操作基本一样
        if ($scope.sort_option.sort_type == $rootScope.SORT_TYPE.VISIT)
        {
            //标记当前在刷新中
            $scope.onRefresh=true;
            $scope.onSortTypeChange();

            return;
        }
        var params={
            first_id: $scope.trade_list[0].trade_id,
            item_type: $scope.trade_list[0].item_type,
            item_subtype: $scope.trade_list[0].item_subtype
        };
        $ionicLoading.show({
            templateUrl: 'templates/loading.html'
        });
        console.log(params);
        var $url='http://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Trade/getLatestDataByTime';
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
                        ImgPathService.generateTradeListImgUrl(data);
                        if(data.length>1)
                        {
                            data.reverse();
                        }

                        $scope.trade_list=data.concat($scope.trade_list);
                        break;
                    case 204:
                        console.log(status);
                        $cordovaToast.showShortCenter("当前已是最新数据");
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
                $timeout(function(){
                    $ionicLoading.hide();
                },$rootScope.LOADING_MIN_TIME);
            });
    };
    //挂单列表展示的代码复用
    $scope.trade_list_show_url="templates/trade-list-show.html";






});