/**
 * Created by Administrator on 2016/5/6.
 */


//这边把logout单独提取出来，防止SocketService和loginoutservice的循环引用问题
rootService.factory('LogOutService',function($ionicPopup,ChatCacheService,
                                               $rootScope,LocalStorage,NetworkStateService,$state,Bank){
    function logout()
    {
        //保存该用户的聊天记录
        ChatCacheService.saveChatDic($rootScope.userInfo.user_id);
        //清空当前的聊天记录
        ChatCacheService.resetCurrentChatCache();
        $rootScope.isLogin=false;
        $rootScope.userInfo=undefined;
        Bank.clearBankCardInfo();
        $rootScope.storeInfo=undefined;
        $state.go('login');
    }


    return{
        logout: logout
    }
});