/**
 * Created by Administrator on 2016/4/7.
 * 用于获取的服务器数据的图像路径转化
 */


rootService.factory('ImgPathService', function($rootScope) {

    //生成tradelist的图片路径
    var generateTradeListImgUrl=function(data)
    {
        for($i=0;$i<data.length;$i++)
        {
            generateTradeImgUrl(data[$i]);
        }

    };
    //生成tradelist的图片路径
    var generateTradeImgUrl=function(data)
    {
        if(data.thumbnail_name!=null)
        {
            data.thumbnail_name="http://"+$rootScope.SERVER_ADDRESS+"/"+data.thumbnail_name;
        }
        else
        {
          //设置默认的图片
            data.thumbnail_name="img/logo.png"
        }
        if(data.img_names!=null)
        {
            data.img_names=data.img_names.split(',');
            for($j=0;$j<data.img_names.length;$j++)
            {
                data.img_names[$j]="http://"+$rootScope.SERVER_ADDRESS+"/" + data.img_names[$j];
            }
        }
    };

    var generateStoreImgUrl=function(data)
    {
        data.store_img_cover="http://"+$rootScope.SERVER_ADDRESS+"/"+data.store_img_cover;
        data.thumbnail_name="http://"+$rootScope.SERVER_ADDRESS+"/"+data.thumbnail_name;
    };

    var generateStoreListImgUrl=function(data)
    {
        for(var i=0;i<data.length;i++)
        {
            generateStoreImgUrl(data[i]);
        }
    };

    //生成聊天图像的路径和大小
    var generateChatImgUrl=function(data)
    {
        var params=data.content.split(",");
        data.origin="http://"+$rootScope.SERVER_ADDRESS+"/"+params[0];//大图
        data.origin_width=params[1];
        data.origin_height=params[2];
        data.thumbnail="http://"+$rootScope.SERVER_ADDRESS+"/"+params[3];//小图
        data.thumbnail_width=params[4];
        data.thumbnail_height=params[5];
    };
    //当data中同时包含user和store信息的时候
    var genUserAndStoreImgUrl = function(data, userKey, storeKey){
        if(data[userKey]) {
            genUserAvatarsUrl(data[userKey]);
        }
        if(data[storeKey]!=null)
        {
            generateStoreImgUrl(data[storeKey]);
        }
    };
    //处理用户头像
    var genUserAvatarsUrl = function(userInfo){
        if(userInfo.avatars_name==null)
        {
            userInfo.avatars_name="img/default_avatars.png"
        }
        else
        {
            userInfo.avatars_name="http://"+$rootScope.SERVER_ADDRESS+"/" + userInfo.avatars_name;
        }
    };



    return{
        generateTradeListImgUrl: generateTradeListImgUrl,
        generateStoreImgUrl: generateStoreImgUrl,
        generateStoreListImgUrl: generateStoreListImgUrl,
        generateChatImgUrl: generateChatImgUrl,
        generateTradeImgUrl: generateTradeImgUrl,
        genUserAndStoreImgUrl: genUserAndStoreImgUrl,
        genUserAvatarsUrl: genUserAvatarsUrl
    }

});
