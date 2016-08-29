/**
 * Created by Administrator on 2016/3/2.
 * 用于处理交易中各种类型相关的信息
 */

rootService.factory('TradeTypeService',function($rootScope,$http,$cordovaToast) {

    //定义交易类型
    var trade_type=[{
        type_name: "出售",
        type_id: 0
    },{
        type_name: "收购",
        type_id: 1
    }];


    //定义商品类型
    var item_type=[{
        type_name: "邮票",
        type_id: 0
    },{
        type_name: "钱币",
        type_id: 1
    },{
        type_name: "卡片",
        type_id: 2
    },{
        type_name: "大宗",
        type_id: 3
    }];
    //单纯数组形式
    var item_types=["邮票","钱币","卡片","大宗"];

    var item_subtype=null;

    //用于标示是否获取数据失败
    var getting_data_fail=false;

    function getTradeType(){
        return trade_type;
    }

    function getItemType(){
        return item_type;
    }
    //获取含id的商品子分区
    function getItemSubtype() {
        return item_subtype;
    }
    //是否获取数据已经失败
    function ifGetDataFail(){
        return getting_data_fail;
    }

    //从服务器获取分区信息，用户打开软件时触发
    function getItemSubtypesFromServer(){
        getting_data_fail=false;
        var $url='https://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Trade/getItemSubTypes';
        $http({
            method: 'get',
            url: $url
        }).
            success(function(data, status, headers, config)
            {
                switch (status)
                {
                    case 200:
                        angular.fromJson(data);
                        console.log(data);
                        item_subtype=data;
                        break;
                }
            }).
            error(function(data, status, headers, config)
            {
                getting_data_fail=true;
                switch(status){
                    default:
                        $cordovaToast.showShortCenter("获取服务器信息失败，请检查您的网络状态");
                        break;
                }
            });
    }


    return{
        getTradeType: getTradeType,
        getItemType: getItemType,
        getItemSubtype: getItemSubtype,
        getItemSubtypesFromServer: getItemSubtypesFromServer,
        ifGetDataFail: ifGetDataFail
    }







});
