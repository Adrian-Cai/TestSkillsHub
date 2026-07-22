from seleniumbase import BaseCase
BaseCase.main(__name__, __file__)


class CreatWeeklyTaskTests(BaseCase):

    def test_creat_weekly_task(self):
        # 创建一个定时任务
        url = "https://autotest.wiac.xyz/login?returnUrl=%2Fdashboard"
        self.open(url)
        self.type('#email', 'zhaoliu@autotest.com')
        self.type('#password', 'test123456')
        self.click("button[type='submit']")
        self.sleep(8)
        self.click("button[title='展开导航']")
        self.click('//span[contains(text(),"任务管理")]')
        self.click('//button[contains(text(),"新建任务")]')
        self.type('input[placeholder="请输入任务名称"]', '测试任务111')
        self.click('//button[contains(text(),"定时触发")]', '定时触发')
        self.click('//button[contains(text(),"每周一")]')
        self.click('//button[contains(text(),"创建任务")]')
        self.assert_text("测试任务111", '//h3[normalize-space()="测试任务111"]')
        
        self.sleep(5)
        self.click('//button[@id=\'radix-:ru:\']//*[name()=\'svg\']')
        self.click('.lucide.lucide-trash2.h-4.w-4')
        
        self.sleep(5)
        self.click("//button[contains(text(),'确认删除')]")