require("UIButton, UIColor","UIViewController","UITableView","UITableViewCell","TestViewController");
defineClass("ViewController", {
    viewDidLoad: function() {
        self.super().viewDidLoad();
        var textBtn = UIButton.alloc().initWithFrame({x:30, y:140, width:100, height:100});
        self.view().addSubview(textBtn);
        textBtn.setBackgroundColor(UIColor.blueColor());
        textBtn.addTarget_action_forControlEvents(self, "handleBtn", 1);
        self.view().setBackgroundColor(UIColor.yellowColor());
        self.setShowText("显示文字33333");
    },
    handleBtn: function() {
      console.log("handleBtn handleBtn handleBtn:%@", self.showText());
      var nextVc = TestViewController2.alloc().init();
      self.presentViewController_animated_completion(nextVc, YES, null);
    }
}, {});

// 这个是新的类
defineClass("TestViewController2:UIViewController<UITableViewDelegate,UITableViewDataSource>", {
    viewDidLoad: function() {
        self.super().viewDidLoad();
        
        
        var tableView = UITableView.alloc().initWithFrame(self.view().bounds());
        tableView.setDelegate(self);
        tableView.setDataSource(self);
        tableView.registerClass_forCellReuseIdentifier(UITableViewCell.self(), "cell_id");
        self.view().addSubview(tableView);
        
        
        
        
        var textBtn = UIButton.alloc().initWithFrame({x:100, y:140, width:100, height:100});
        self.view().addSubview(textBtn);
        textBtn.setBackgroundColor(UIColor.redColor());
        textBtn.addTarget_action_forControlEvents(self, "closePage", 1);
        self.view().setBackgroundColor(UIColor.greenColor());
    },
    tableView_cellForRowAtIndexPath: function(tableView, indexPath) {
        var cell = tableView.dequeueReusableCellWithIdentifier_forIndexPath("cell_id", indexPath);
        cell.textLabel().setText("hello");
        return cell;
    },
    numberOfSectionsInTableView: function(tableView) {
        return 10;
    },
    tableView_numberOfRowsInSection: function(tableView, section) {
        return 1;
    },
    tableView_heightForRowAtIndexPath: function(tableView, indexPath) {
        return 60;
    },
    closePage: function() {
        self.dismissViewControllerAnimated_completion(YES, null);
    }
}, {});




