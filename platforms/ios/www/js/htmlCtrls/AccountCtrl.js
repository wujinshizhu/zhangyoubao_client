/**
 * Created by wujin on 2015/12/1.
 * 用于个人账户信息界面的展示
 */

rootModule.controller('AccountCtrl', function($scope,$state,$rootScope,LoginoutService,$ionicPopup,$cordovaToast,
                                              CameraService,$cordovaCamera,$ionicActionSheet,$cordovaFileTransfer,$ionicLoading) {

    $scope.$on('$ionicView.beforeEnter',function(){
        if($rootScope.isLogin==false)
        {
            $state.go('login');
        }
    });

    $scope.onLogout=function(){
        $ionicPopup.show({
            template: '是否确认退出登录',
            title: '用户提示',
            scope: $scope,
            buttons: [
                {
                    text: '取消',
                    onTap: function(){

                    }
                },
                {
                    text: '<b>确认</b>',
                    type: 'button-positive',
                    onTap: function(){
                        LoginoutService.logout();
                    }
                }
            ]
        });

    };


//    var logout=function(){
//        $rootScope.isLogin=false;
//        $rootScope.userInfo=undefined;
//        $state.go('login');
//    };

    $scope.userInfo=$rootScope.userInfo;

    $scope.onVerifyClick=function()
    {
        switch (Number($rootScope.userInfo.certify_state))
        {
            case $rootScope.VERIFY_STATE.UNCOMMIT:
                $state.go("certification");
                break;
            case $rootScope.VERIFY_STATE.COMMITED:
                $cordovaToast.showShortCenter("您已提交实名认证信息，正在审核中，感谢您的耐心等候");
                break;
            case $rootScope.VERIFY_STATE.PASSED_VERIFY:
                $cordovaToast.showShortCenter("您的实名认证已通过");
                break;
        }
    };

    $scope.onStoreRegisterClick=function()
    {
        if($rootScope.storeInfo==undefined)
        {
            $state.go("store-register");
        }
        else
        {
            switch (Number($rootScope.storeInfo.certify_state))
            {
                case $rootScope.VERIFY_STATE.UNCOMMIT:
                    $state.go("store-register");
                    break;
                case $rootScope.VERIFY_STATE.COMMITED:
                    $cordovaToast.showShortCenter("您已提交实体店认证信息，正在审核中，感谢您的耐心等候");
                    break;
                case $rootScope.VERIFY_STATE.PASSED_VERIFY:
                    $cordovaToast.showShortCenter("您的实体店认证已通过，您可以在‘我的商铺’中管理您的网上店铺");
                    break;
            }
        }
    };


    $scope.onChangeAvatars=function(){
        $cordovaToast.showShortCenter("裁剪框的边角可以拉动以调整裁剪范围大小");
        var hideSheet = $ionicActionSheet.show(
        {
            buttons: [
                { text: '<b>拍照</b>' },
                { text: '<b>相册</b>' }
            ],
            titleText: '<b>图片选择</b>',
            cancelText: '<b>取消</b>',
            cancel: function () {
                // add cancel code..
            },
            buttonClicked: function (index)
            {

                var options = CameraService.optionGenerateWithAvatars(index);
                //var options=CameraService.optionsGenerate(index,img_quality);
                //图像的裁剪
                $cordovaCamera.getPicture(options).then(function (imageUrl) {
                    $scope.avatarsUrl = imageUrl;
                    console.log(imageUrl);
                    $ionicPopup.confirm({
                        title: '更改头像',
                        template: '是否确认更改头像，一旦更改无法返回<br>' +
                            '<div class="text_center">' +
                            '<img ng-src="{{avatarsUrl}}" width="50%">' +
                            '</div>',
                        cancelText: '取消',
                        okText: '确认更改',
                        scope: $scope
                    }).then(function(result){
                        if(result)
                        {
                            uploadAvatars();
                        }
                    });
                }, function (err) {
                    console.log(err);
                });


                return true;

            }

        });
    };

    //上传照片
    var uploadAvatars=function(){
        //处理$scope.tradeInfo.img_urls，去掉空闲项

        $ionicLoading.show({
            template: '头像上传中，请耐心等候..'
        });
        $server='https://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Upload/uploadAvatars';

        var options = {
            params: {user_id: $scope.userInfo.user_id}
        };
        $cordovaFileTransfer.upload($server, $scope.avatarsUrl, options,true)
            .then(function(result) {
                console.log(result);
                if(result.responseCode==200)
                {
                    $rootScope.userInfo.avatars_name='https://'+$rootScope.SERVER_ADDRESS+'/'+result.response;
                    console.log($rootScope.userInfo.avatars_name);
                    $cordovaToast.showShortCenter("更改成功");
                }


                // Success!
            }, function(err) {
                console.log(err);
                $ionicPopup.alert({
                    title: '图片上传失败',
                    template: '目前仅支持手机拍照和相册中jpg格式的文件上传，请检查网络连接后重新拍照上传'
                });

            }, function (progress) {
                //在此可以加入实名认证的进度条，后期工作
                // constant progress updates
                //console.log(progress);
            }).finally(function(){
                $ionicLoading.hide();
            });

    };



});
