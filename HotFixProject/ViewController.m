//
//  ViewController.m
//  HotFixProject
//
//  Created by bairdweng on 2020/11/2.
//

#import "ViewController.h"

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    CGRect rect = CGRectMake(0, 0, 50, 100);
    UIButton *textBtn = [[UIButton alloc]initWithFrame:rect];
    [self.view addSubview:textBtn];
    textBtn.backgroundColor = [UIColor redColor];
    [textBtn addTarget:self action:@selector(handleBtn) forControlEvents:UIControlEventTouchUpInside];
    // Do any additional setup after loading the view.
}

- (void)handleBtn {
    NSLog(@"handleBtn handleBtn handleBtn");
}

@end
