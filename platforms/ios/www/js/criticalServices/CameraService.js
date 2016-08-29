/**
 * Created by wujin on 2015/11/3.
 * 封装所有与摄像头相关的服务
 */


rootModule.factory('CameraService',function($cordovaCamera){
    //根据输入type生成option，根据quality确定图片的质量
    function optionsGenerate(type) {
        var source;
        switch (type) {
            case 0:
                source = Camera.PictureSourceType.CAMERA;
                break;
            case 1:
                source = Camera.PictureSourceType.PHOTOLIBRARY;
                break;
        }
        return {
            quality: img_quality,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: source,
            allowEdit: false,
            encodingType: Camera.EncodingType.JPEG,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
        };
    }

    /**
     * 聊天图像获取的参数生成，不直接返回URI，而是返回Base64的数据，这样压缩函数就能够正确获取图像信息
     * @param type
     * @returns {{quality: number, destinationType: (exports.DestinationType.FILE_URI|*), sourceType: *, allowEdit: boolean, encodingType: (exports.EncodingType.JPEG|*), popoverOptions: CameraPopoverOptions, saveToPhotoAlbum: boolean}}
     * @constructor
     */
    function ImgDataOptionsGenerate(type) {
        var source;
        switch (type) {
            case 0:
                source = Camera.PictureSourceType.CAMERA;
                break;
            case 1:
                source = Camera.PictureSourceType.PHOTOLIBRARY;
                break;
        }
        return {
            quality: img_quality,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: source,
            allowEdit: false,
            encodingType: Camera.EncodingType.JPEG,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
        };
    }

    //图像获取时进行图像的裁剪，长宽比控制为1:1
    function optionGenerateWithEdit(type) {
        var source;
        switch (type) {
            case 0:
                source = Camera.PictureSourceType.CAMERA;
                break;
            case 1:
                source = Camera.PictureSourceType.PHOTOLIBRARY;
                break;
        }
        return {
            quality: img_crop_quality,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: source,
            allowEdit: true,
            targetWidth: crop_size,
            targetHeight: crop_size,
            encodingType: Camera.EncodingType.JPEG,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
        };
    }

    //头像图像获取时进行图像的裁剪，长宽比控制为1:1
    function optionGenerateWithAvatars(type) {
        var source;
        switch (type) {
            case 0:
                source = Camera.PictureSourceType.CAMERA;
                break;
            case 1:
                source = Camera.PictureSourceType.PHOTOLIBRARY;
                break;
        }
        return {
            quality: img_crop_quality,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: source,
            allowEdit: true,
            targetWidth: avatars_crop_size,
            targetHeight: avatars_crop_size,
            encodingType: Camera.EncodingType.JPEG,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
        };
    }

    var img_quality=50;//设定非裁剪获取的图像质量
    var img_crop_quality=100;//裁剪获取图像质量
    var crop_size=800;//设定全局图像裁剪的大小
    var avatars_crop_size=500;//头像图片裁剪大小

    function getImgQuality()
    {
        return img_quality;
    }

    function getCropSize()
    {
        return crop_size;
    }

    return{
        optionsGenerate:optionsGenerate,
        optionGenerateWithEdit:optionGenerateWithEdit,
        optionGenerateWithAvatars: optionGenerateWithAvatars,
        ImgDataOptionsGenerate: ImgDataOptionsGenerate
//        getImgQuality: getImgQuality,
//        getCropSize: getCropSize
    }



});