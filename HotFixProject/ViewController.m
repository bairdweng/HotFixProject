//
//  ViewController.m
//  BWHotFix
//
//  Created by bairdweng on 2020/11/4.
//

#import "ViewController.h"

@interface ViewController ()
// 看看属性怎么hook
@property(nonatomic,copy)NSString *showText;
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    CGRect rect = CGRectMake(0, 0, 50, 100);
    UIButton *textBtn = [[UIButton alloc]initWithFrame:rect];
    [self.view addSubview:textBtn];
    textBtn.backgroundColor = [UIColor yellowColor];
    [textBtn addTarget:self action:@selector(handleBtn) forControlEvents:UIControlEventTouchUpInside];
    self.showText = @"显示文字";
    // Do any additional setup after loading the view.
}

- (void)handleBtn {
    NSLog(@"handleBtn handleBtn handleBtn:%@",self.showText);
    UIViewController *nextVc = [[UIViewController alloc]init];
    [self presentViewController:nextVc animated:YES completion:nil];
}

@end
