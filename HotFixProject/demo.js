require("UIButton, UIColor");
// 会在全局下创建一个 UIViewController 对象
/*
global: {
  UIViewController: {
    __clsName: 'ViewController'
  }
} */
defineClass("ViewController", {
    viewDidLoad: function() {
        self.super().viewDidLoad();
        var textBtn = UIButton.alloc().initWithFrame({x:20, y:140, width:100, height:100});
        self.view().addSubview(textBtn);
        textBtn.setBackgroundColor(UIColor.redColor());
        textBtn.addTarget_action_forControlEvents(self, "handleBtn", 1);
    },
    handleBtn: function() {
        console.log('看，我hook了OC的handleBtn方法')
    }
}, {});


