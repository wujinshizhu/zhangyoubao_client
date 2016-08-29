/**
 * Created by wujin on 2016/4/6.
 * 用于挂单、商铺信息的缓存
 * 每次获取详细信息成功后，以trade_id为键值构建字典，存储所有相关信息，每次获取detail之前判断缓存中是否存在
 */

rootService.factory('LocalInfoCache',function($ionicPopup,$cordovaToast) {

  var tradeDic=[];
  var storeDic=[];
  var saveTradeInfo=function(key,value){
      if(tradeDic[key]==undefined)
      {
          tradeDic[key]=value;

      }

  };

    var saveStoreInfo=function(key,value){
        if(storeDic[key]==undefined)
        {
            storeDic[key]=value;

        }

    };

  //尝试从cache中读取已经获取过的页面信息
  var getTradeInfo=function(key)
  {
      if(tradeDic[key]!=undefined)
      {

          return tradeDic[key];
      }
      else
      {
          return null;
      }
  };

    var getStoreInfo=function(key)
    {
        if(storeDic[key]!=undefined)
        {

            return storeDic[key];
        }
        else
        {
            return null;
        }
    };


  return{
      saveTradeInfo: saveTradeInfo,
      getTradeInfo: getTradeInfo,
      saveStoreInfo: saveStoreInfo,
      getStoreInfo: getStoreInfo
  }
});