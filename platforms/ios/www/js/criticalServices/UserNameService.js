/**
 * Created by Administrator on 2016/5/8.
 * 关于用户名称拆分和显示的服务
 */


rootService.factory('UserNameService',function(){


    /**
     * 用于处理用户姓名并返回应该显示在屏幕上的值
     * @param fullname 传入的用户姓名
     * @param sex      传入的用户性别
     * @return  ret_name 处理后的返回姓名
     */
    function handleUserName(fullname,sex){
        //复姓列表
        var hyphenated = ['欧阳','太史','端木','上官','司马','东方','独孤','南宫','万俟','闻人','夏侯','诸葛','尉迟','公羊','赫连','澹台','皇甫',
            '宗政','濮阳','公冶','太叔','申屠','公孙','慕容','仲孙','钟离','长孙','宇文','城池','司徒','鲜于','司空','汝嫣','闾丘','子车','亓官',
            '司寇','巫马','公西','颛孙','壤驷','公良','漆雕','乐正','宰父','谷梁','拓跋','夹谷','轩辕','令狐','段干','百里','呼延','东郭','南门',
            '羊舌','微生','公户','公玉','公仪','梁丘','公仲','公上','公门','公山','公坚','左丘','公伯','西门','公祖','第五','公乘','贯丘','公皙',
            '南荣','东里','东宫','仲长','子书','子桑','即墨','达奚','褚师'];
        var nameLength = fullname.length;
        //姓氏
        var familyName="";
        if(nameLength > 2){
            var preTwoWords = fullname.substr(0, 2);//取命名的前两个字,看是否在复姓库中
            if(hyphenated.indexOf(preTwoWords) != -1){
                //改姓名为复姓
                familyName = preTwoWords;
            }else{
                familyName = fullname.substr(0, 1);
            }
        }else if(nameLength == 2){//全名只有两个字时,以前一个为姓,后一下为名
            familyName = fullname.substr(0, 1);
        }else{
            familyName = fullname;
        }
        //返回值
        var ret_name=familyName;
        //获得姓氏之后，根据性别进行判断
        if(sex=="男")
        {
            ret_name+="先生";
        }
        else
        {
            ret_name+="女士";
        }
        return ret_name;
    }

    /**
     * 设置用户尊称
     * @param userInfo 传入用户信息
     */
    function setUserNameRespect(userInfo)
    {
        userInfo.userNameRespect=handleUserName(userInfo.name,userInfo.sex);
    }

    return{
        setUserNameRespect: setUserNameRespect
    }
});

