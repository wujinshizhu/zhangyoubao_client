/**
 * Created by wujin on 16/8/12.
 */

//图片相关的数据存储，数据将以json格式存储在本地文件中
rootService.factory('ExceptionService', function($ionicPopup, $rootScope) {

    function paramsError(){
        $ionicPopup.alert({
          title: '错误',
          template: '参数传递出现错误,请稍后重试'
        });
        $rootScope.goBack();
    }

    function applicationNotExistError(){
      $ionicPopup.alert({
        title: '错误',
        template: '该交易信息不存在'
      });
      $rootScope.goBack();
    }

    function defaultError(){
      $ionicPopup.alert({
        title: '错误',
        template: '数据请求发生错误,请检查网络状态并稍后重试'
      });
    }


    return{
        paramsError: paramsError,
        applicationNotExistError: applicationNotExistError,
        defaultError: defaultError
    }
});
