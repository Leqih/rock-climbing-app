/* 中文 / English: the volume-down button switches the prototype's language.
   app.js always writes English. In Chinese, every text node and label on the page is looked up here as it appears:
   an exact match first, then a pattern ({} is any text, translated in turn; {1} picks a piece out of order),
   then piece by piece around " · ". Anything not found stays in English. */
const ZH = {
  // ---- pick your climbing style
  "Pick ✦": "Pick ✦", "your climbing style": "你的攀岩喜好", "🤔 What do you like to climb? (pick any)": "🤔 你喜欢爬什么呢？（可多选）", "Picked {}": "已选{}个",
  "Top rope": "顶绳", "Bouldering": "抱石", "Lead": "先锋", "Slab": "板墙", "Overhang": "仰角", "Training": "训练", "All of it": "都可以", "Skip for now": "先跳过", "Pick your style": "选你的喜好",
  "Add a try ✦": "添加一次尝试 ✦", "Best": "推荐", "New": "新",
  // ---- video detail: speed, tabs, confirming
  "Speed": "速度", "Summary": "总结", "Body": "身体", "Path": "路径", "Tries": "尝试", "Info": "信息",
  "Analysing your climb": "正在分析你的攀爬", "Finding you, reading the route and working out your moves. You can leave this page.": "正在找到你、读取路线并算出动作。你可以先离开这个页面。",
  "Is this right?": "这样对吗？", "We found you on {}. Confirm once and we’ll remember this route for your next tries.": "我们在 {} 上找到了你。确认一次后，下次尝试这条路线会自动沿用。",
  "Looks right": "没问题", "Fix it": "修改", "Wrong route? Change it": "路线不对？更改", "Tap yourself": "点出你自己", "Tap your head, hands and feet on the video.": "在视频上点你的头、手和脚。", "Cancel": "取消", "Undo": "撤销", "Done": "完成",
  "Head": "头部", "Tap your head": "点你的头", "Tap your left hand": "点你的左手", "Tap your right hand": "点你的右手", "Tap your left foot": "点你的左脚", "Tap your right foot": "点你的右脚",
  "We couldn’t find you here. Tap your head, hands and feet on the video.": "这里没找到你。请在视频上点你的头、手和脚。",
  "Going through the whole video, following your hands, feet, elbows and hips. You can leave this page.": "正在完整看一遍视频，跟踪你的手、脚、手肘和髋部。你可以先离开这个页面。",
  "Moves": "动作", "Arms": "手臂", "Hips": "髋部", "Rests": "休息", "Rest, arms straight": "休息，手臂伸直", "Rest, arms bent": "休息，手臂弯曲", "{} of {}": "{0} / {1}",
  "Left hand moving": "左手在动", "Right hand moving": "右手在动", "Left foot moving": "左脚在动", "Right foot moving": "右脚在动", "Resting · {} s": "休息中 · {} 秒", "Between moves": "动作之间", "Can’t see you here": "这里看不到你",
  "Straight · {}°": "伸直 · {}°", "Bent · {}°": "弯曲 · {}°", "Film from further back, phone on the floor, so your whole body stays in frame.": "把手机放地上、离远一点拍，让全身都在画面里。",
  "In this video": "这个视频里", "{} moves": "{} 个动作", "1 move": "1 个动作", "{} with a hand": "{} 次用手", "1 with a hand": "1 次用手", "{} with a foot": "{} 次用脚", "1 with a foot": "1 次用脚", "Your longest rest": "你最长的一次休息", "{} s": "{} 秒",
  "Your arms at their most bent, resting": "休息时手臂弯得最厉害的时刻", "Your hips, furthest from your feet": "你的髋部离脚最远的时刻", "We could see you in {}% of this video. Tap a row to watch that moment.": "这个视频里 {}% 的时间能看到你。点一行就能看那个时刻。",
  "Your whole climb": "你的整段攀爬", "Arms straight": "手臂伸直", "Hips over feet": "髋部在脚上方", "Share of the time from your first move to your last, in this video.": "按这个视频里从第一个动作到最后一个动作的时间计算。",
  "Example": "示例", "Not read from this video: a reason needs the hold map, which isn’t built yet.": "这不是从这个视频读出来的：判断原因需要岩点地图，目前还没有。",
  "Check this": "需要确认", "Analysing": "分析中", "{} to check": "{} 条待确认",
  "Hand & foot moves": "手脚移动", "{} hand and foot moves": "手脚移动 {} 次", "1 hand or foot move": "手脚移动 1 次", "{} with a hand, {} with a foot": "用手 {0} 次，用脚 {1} 次",
  "Reached move {} of {} on this route.": "在这条路线上到了第 {0} 步，共 {1} 步。", "The main thing": "这次的重点", "What we measured": "我们测到的", "Next try": "下次尝试", "See it in the video · {}": "在视频里看 · {}",
  "Very bent · {}°": "弯得很厉害 · {}°", "Your arms at their most bent, resting. 180° is straight": "休息时手臂弯得最厉害的时刻。180° 是完全伸直",
  "Too little to judge": "信息太少，还不好判断", "We only saw {} hand and foot moves in this video.": "这个视频里只看到手脚移动 {} 次。", "We only saw 1 hand or foot move in this video.": "这个视频里只看到手脚移动 1 次。", "Film a whole try, from the first hold to where you stop.": "把一次尝试完整拍下来，从第一个点拍到你停下的地方。",
  "Rest on straighter arms": "休息时把手臂伸直", "Your arms were straight in {}% of your rests.": "你只有 {}% 的休息时间手臂是伸直的。", "At each rest, let one arm go straight and hang from it.": "每次休息时，让一只手臂伸直挂住。",
  "Keep your hips over your feet": "让髋部保持在脚的上方", "Your hips were over your feet for {}% of the climb.": "整段攀爬中，只有 {}% 的时间髋部在脚的上方。", "Before you reach, move your hips above the foot you’re standing on.": "伸手之前，先把髋部移到支撑脚的上方。",
  "Use your feet more": "多用脚", "You moved your hands {} times and your feet {} times.": "你的手移动了 {0} 次，脚移动了 {1} 次。", "Move a foot up before each reach.": "每次伸手之前，先把脚往上移。",
  "Take a rest on the way": "途中休息一下", "We didn’t see you stop for more than a second.": "我们没看到你停下超过一秒。", "Pick one good hold and shake out each arm.": "选一个好点，停下来轮流甩甩手臂。",
  "Good control": "控制得不错", "Hips over your feet for {}% of the climb.": "{}% 的攀爬时间髋部在脚的上方。", "Too far from the camera to read your arms here.": "这里离镜头太远，看不清手臂。", "Share of the time from your first move to your last, in this video. Too far from the camera to read your arms.": "按这个视频里从第一个动作到最后一个动作的时间计算。离镜头太远，看不清手臂。", "Arms straight in {}% of your rests, and hips over your feet for {}% of the climb.": "{0}% 的休息时间手臂伸直，{1}% 的攀爬时间髋部在脚的上方。", "Keep this up on the next route.": "下一条路线继续保持。",
  "{} of your tries · {} to check": "{0} · {1} 条待确认",
  "Your hips stayed right of your feet": "髋部一直在两脚右侧", "Your hips stayed left of your feet": "髋部一直在两脚左侧", "Your hips stayed out to the right": "髋部一直偏右", "Your hips stayed out to the left": "髋部一直偏左", "From {} to {}. That isn’t always a mistake: you may be hanging off a hold or setting up the next move.": "从 {0} 到 {1}。这不一定是错误：你可能正挂在岩点上，或在为下一步做准备。", "What happened next": "接下来发生了什么", "At {} your right foot moved across and your hips were back over your feet.": "{} 时右脚移了过去，髋部回到了脚的上方。", "At {} your left foot moved across and your hips were back over your feet.": "{} 时左脚移了过去，髋部回到了脚的上方。", "At {} your hips came back over your feet.": "{} 时髋部回到了脚的上方。", "They stayed out until the end of the climb.": "之后一直没有回来。", "Did that feel planned, or were you stuck?": "当时是有计划的，还是卡住了？", "For comparison": "用来对比", "You’ve done this": "你已经做到过", "Clearest here": "这里最明显", "Furthest here": "这里偏得最远",
  "How it could look": "可以这样做", "You": "你", "Simulated": "模拟", "Your hips settle over your feet": "髋部随之回到两脚上方", "Shift your hips over your feet": "把髋部移到两脚上方",
  "Left foot to the spot you reached at {}": "左脚先踩到你 {} 时踩的位置", "Right foot to the spot you reached at {}": "右脚先踩到你 {} 时踩的位置",
  "Sink under the hold: this arm goes from {}° to {}°": "身体沉到岩点下方：这只手臂从 {0}° 伸到 {1}°",
  "Left foot up first": "先把左脚抬高", "Right foot up first": "先把右脚抬高", "Left foot up first, to where it landed at {}": "先把左脚抬到它 {} 时踩的位置", "Right foot up first, to where it landed at {}": "先把右脚抬到它 {} 时踩的位置", "Stand up on it, then reach": "踩住站起来，再伸手",
  "Worked out from your body in this frame. It’s a guide: we can’t see every hold.": "根据这一帧里你的身体算出来，仅供参考：我们看不到所有岩点。", "Worked out from your body in this frame. We can’t see the holds, so the foot position is a guess.": "根据这一帧里你的身体算出来。我们看不到岩点，所以脚的位置是估计的。",
  "Import videos": "导入视频", "{} video needs a route": "{} 个视频需要线路", "{} videos need a route": "{} 个视频需要线路",
  "You and {}": "你和 {}", "Same route": "同一条线路", "{} cm · climbing for over 10 years": "{} 厘米 · 攀岩超过 10 年", "Timed from a coach’s labels on these two videos.": "时间来自教练对这两段视频的标注。", "Same left-hand hold, then two different choices. {} went straight on and reached the next high hold in {} s. Your left hand went back to a lower hold first, and you took {} s.": "左手抓住同一个岩点后，两人的选择不同。{0} 继续向上，{1} 秒就够到下一个高点；你的左手先退回到更低的岩点，用了 {2} 秒。", "Play side by side": "并排播放", "Pause both": "暂停", "Watch again": "再看一次",
  "Same boulder": "同一条抱石", "Try": "第几次", "Edit video": "编辑视频", "Edit video · {} of {}": "编辑视频 · 第 {0}/{1} 个", "Length": "长度", "Community": "社区", "Social": "社区", "For you": "推荐", "Share": "分享", "{} shared {}": "{0} 分享了 {1}", "{} filmed {}": "{0} 拍了 {1}", "shared {}": "分享了 {}", "Bouldering": "抱石", "Shared from TikTok": "转自 TikTok", "30 min ago": "30 分钟前", "{} · 30 min ago": "{} · 30 分钟前", "Look how she keeps her hips in on the overhang.": "看她在仰角上怎么把髋部贴近墙。", "Goals": "目标", "Saving this": "收藏了", "Heel hooks on the big volumes.": "在大体积块上挂脚跟。", "Big reach at the end.": "最后一步伸得好远。", "That last move!": "最后那步！", "Steep and fun.": "又陡又好玩。", "Proof that anyone can boulder 🙌": "谁都能玩抱石 🙌", "Love this": "太喜欢了", "A few climbs from one session.": "一次训练里的几条线。", "Short one.": "短的一条。", "6 h ago": "6 小时前", "{} · 6 h ago": "{} · 6 小时前", "Steep one today.": "今天爬了条陡的。", "Strong!": "好强！", "Big move at the top 💪": "最后一步好大 💪", "Clean": "干净利落", "Second session this week.": "这周第二次来了。", "Trying to keep my hips close to the wall.": "努力让髋部贴近墙。", "The whole thing, start to top.": "从起步到登顶，全程。", "Smooth!": "好顺！", "Overhang day.": "今天练仰角。", "Fell twice before this one.": "这次之前掉了两次。", "Slab practice: feet, feet, feet.": "练斜板：脚、脚、还是脚。", "filmed {}": "拍了 {}", "Boulder 2": "2 号抱石", "5 days ago": "5 天前", "{} · 5 days ago": "{} · 5 天前", "Women’s comp, boulder 2. Watch how she uses the big red volume for her feet.": "女子比赛，2 号抱石。看她怎么把脚踩在大红色体积块上。", "So much body tension": "核心好稳", "Same boulder, different climber: she goes straight up the arête.": "同一条线，另一位选手：她直接沿着棱角往上爬。", "Low start on the red volume, then a big step up.": "从红色体积块低位起步，然后一大步站上去。", "Saving this for the footwork": "收藏了，学脚法", "Short and calm.": "短而稳。", "First go on boulder 2.": "2 号抱石第一次尝试。", "Same climber, second go. Smoother on the top holds.": "同一位选手，第二次尝试。上面几个点顺多了。", "Way better second try": "第二次好太多了", "4 h ago": "4 小时前", "2 days ago": "2 天前", "3 days ago": "3 天前", "4 days ago": "4 天前", "{} · 4 h ago": "{} · 4 小时前", "{} · 2 days ago": "{} · 2 天前", "{} · 3 days ago": "{} · 3 天前", "{} · 4 days ago": "{} · 4 天前", "{} · 2 h ago": "{} · 2 小时前", "{} · 1 h ago": "{} · 1 小时前", "Wall D": "D 墙", "Finally! Fourth session on this one.": "终于！这条练了四次。", "Huge!": "太强了！", "That top move 👏": "最后那步 👏", "Warm-up lap.": "热身一趟。", "Warm-up?!": "这叫热身？！", "Any tips for the middle section?": "中间那段有什么建议吗？", "Trust your feet, there are good holds low.": "相信脚，下面有好点。", "Slow and steady.": "慢慢来，稳稳的。", "First time on the lead wall.": "第一次上先锋墙。", "Looking strong": "很稳啊", "Filmed the whole thing for Omar.": "给 Omar 拍了全程。", "Thanks, watching it now": "谢啦，正在看", "Fell at the last hold again.": "又在最后一个点掉了。", "Different beta this time.": "这次换了个爬法。", "{} cm · climbing for over 10 years": "{} 厘米 · 攀岩超过 10 年", "side by side": "并排播放", "{}’s page": "{} 的主页", "Follow": "关注", "Following": "已关注", "Unfollowed {}": "已取消关注 {}", "sends": "次完攀", "hardest": "最难", "climbs this week": "本周攀爬", "Routes you both climbed": "你们都爬过的线路", "Your try next to theirs, played side by side": "你的尝试和 TA 的并排播放", "{} video": "{} 个视频", "Watch {} on {}": "观看 {0} 爬 {1}", "Sample person: name, numbers and posts are made up. The videos are real.": "示例人物：名字、数据和帖子都是虚构的，视频是真实的。", "{} cm · climbing for under a year": "{} 厘米 · 攀岩不到 1 年", "{} cm · climbing for 2–5 years": "{} 厘米 · 攀岩 2–5 年", "{} · 3 h ago": "{} · 3 小时前", "{} · 5 h ago": "{} · 5 小时前", "Save": "收藏", "Saved to your profile": "已收藏到你的主页", "Following {}": "已关注 {}", "Link copied": "链接已复制", "{} comment": "{} 条评论", "{} comments": "{} 条评论", "Be the first to comment.": "来发第一条评论吧。", "Follow {}": "关注 {}", "Post a video": "发布视频", "Climbs people posted · newest first": "大家发布的攀爬 · 最新的在前", "{} climbed {}": "{0} 爬了 {1}", "Copy link": "复制链接", "Like": "点赞", "Comment": "评论", "Took my time on the low section.": "下半段慢慢来的。", "Second go felt much smoother.": "第二次顺多了。", "Still working the top.": "顶部还在练。", "Clean!": "真干净！", "Any tips for the last move?": "最后一步有什么建议吗？", "Keep your hips close.": "髋部贴近墙。", "Now": "当前", "{} s selected": "已选 {} 秒", "{} s selected · plays in {} s": "已选 {0} 秒 · 播放 {1} 秒", "Speed": "速度", "Details": "详情", "Try {}": "第 {} 次", "Which try on this route": "这是这条线路的第几次", "Tape colour and grade": "胶带颜色和难度", "How it ended": "结果", "Still working on it": "还在尝试", "Next video": "下一个视频", "{} of {}": "第 {0}/{1} 个", "Post to community": "发布到社区", "Posted": "已发布", "Analyse": "分析", "Not analysed": "未分析", "Posted to the community": "已发布到社区", "Pick the tape colour and grade first": "请先选择胶带颜色和难度", "Length, speed and details": "长度、速度和详情", "Only the videos you pick leave your phone.": "只有你选的视频会离开手机。", "posted {}": "发布了 {}", "You posted {}": "你发布了 {}", "Gym": "岩馆", "{} cm · climbing for 5–10 years": "{} 厘米 · 攀岩 5–10 年", "{} cm · climbing for 1–2 years": "{} 厘米 · 攀岩 1–2 年", "Same hold, then two ways to the next hold you both used.": "抓住同一个岩点后，两人用不同的方式到达下一个共同岩点。", "You: {} s · {} hand moves": "你：{0} 秒 · {1} 次手部动作", "{}: {} s · {} hand moves": "{0}：{1} 秒 · {2} 次手部动作", "{}: {} s · {} hand move": "{0}：{1} 秒 · {2} 次手部动作", "{} and {}": "{0} 和 {1}", "World Cup Munich 2019": "2019 慕尼黑世界杯", "Competition wall": "比赛岩壁", 
  
  
  "Watch the two big yellow holds. Both climbers hang from them with their feet high on the right one. Garnbret goes on to the top yellow hold. The film leaves this try by Rakovec at the big holds.": "注意那两个黄色大岩点。两人都吊在上面，脚高高踩在右边那个上。Garnbret 继续上到顶部的黄色岩点；Rakovec 这次尝试，影片停在大岩点那里。",
  "Watch the dark block low on the wall. Both climbers stand on it to reach up the edge of the wall.": "注意岩壁下方那块深色岩块。两人都踩在上面，再沿着岩壁边缘向上够。",
  "Picked by hand from the film. It’s edited, so don’t compare the time they take.": "片段和说明由人工从影片中挑选。影片经过剪辑，所以不要比较两人用的时间。",
  "Simulated climb": "模拟攀岩", "From this video": "来自这段视频", "Your holds": "你的岩点", "You, from the video": "视频里的你", "Film a try. We find every move.": "拍一条，我们找出你的每一步。", "Phone on the floor, your whole body in frame. We find your hands and feet, each move, and where you came off.": "手机放在地上，全身入镜。我们会找出你的手和脚、每一步动作，以及你在哪里掉下来。", "22 hand and foot moves": "22 个手脚动作", "found in this video, with where the climber came off and how long each rest was": "从这段视频里找到，还有在哪里掉下来、每次休息多久", "Your sends are public: friends see what you top and can comment. Any climb can be hidden, anytime.": "你的完攀默认公开：朋友能看到你爬完了什么并评论。任何一条都能随时隐藏。", "Not now, look around first": "先不了，四处看看", "Import from Photos": "从相册导入", "None yet. Routes you film, scan or log here show up here.": "还没有。你在这里拍过、扫描过或记录过的线路会显示在这里。", "Film a try": "拍一条", "All videos": "全部视频", "Pinned": "置顶", "Topped!": "登顶！", "Hardest send": "最难完攀", "Saved!": "存好了！", "{} sends!": "{} 次完攀！", "1 send!": "1 次完攀！", "You": "你", "filmed it": "拍过", "Start": "开始", "rope wall": "绳索墙", "All": "全部", "Compare with them": "和他们对比", "Days by hand": "天手动记录", "Routes topped": "条线路已登顶", "{} on video": "{} 在视频里", "Boulder": "抱石", "Climbs you log go under this gym": "记下的攀爬会算在这个场馆", "Send⁠": "完攀", "Lead": "先锋", "Swipe up": "上划", "tap": "点", "swipe down": "下划", "Tap a grade above to log a climb": "点上面的难度来记一条", "Grade breakdown": "难度分布", "Save session": "保存这次", "Today · {} climbs": "今天 · {} 条", "Today · 1 climb": "今天 · 1 条", "1 climb": "1 条", "By grade": "按难度", "Back to the grades": "回到难度", "Every climb, one by one": "逐条查看", "only you see these": "只有你能看到", "Logged by hand, without a route": "手动记录，没有对应线路", "Remove {}": "删除 {}", "Open": "打开", "With {}": "和 {} 一起", "Today’s highlight reel": "今天的集锦", "From today’s videos": "今天的视频", "Look at your analysis": "看你的分析", "As a poster": "做成海报", "Everything today was logged by hand. Film a try next time and it gets an analysis and a poster.": "今天都是手动记录的。下次拍一条，就能有分析和海报。", "See the beta": "看 beta", "Your moves and the beta": "你的动作和 beta", "From how Leo topped it": "来自 Leo 登顶的方式", "from how Leo topped it": "来自 Leo 登顶的方式", "Beta · {}": "Beta · {}", "You: {} hand moves": "你：{} 次手部动作", "You: 1 hand move": "你：1 次手部动作", "Leo’s beta: {}": "Leo 的 beta：{}", "{} hand moves, hold by hold": "{} 次手部动作，一个点一个点看", "Keep climbing": "继续爬", "Clock started, tap it up top to end": "已开始计时，点顶部的时间可结束", "{} tries in all": "一共 {} 次", "1 try in all": "一共 1 次", "By hand": "手动", "by hand": "手动记录", "{} days by hand": "{} 天手动记录", "1 day by hand": "1 天手动记录", "0 videos": "0 条视频", "Photo a route, see its beta": "拍下一条线，看它的 beta", "Fit one route in the frame, from the first hold to the top.": "把一条线完整放进画面，从第一个岩点到顶。", "{} holds": "{}岩点", "Green holds": "绿色岩点", "Orange holds": "橙色岩点", "Spotter reads the hold colour, finds the route, and draws its beta on your photo.": "Spotter 读出岩点颜色，找到这条线，把 beta 画在你的照片上。", "In this prototype, pick which route the camera is pointing at.": "在这个原型里，请选相机对着哪条线。", "Reading the wall": "正在读取岩壁", "Finding the holds and the route.": "正在找岩点和线路。", "{} hand moves": "{} 个手部动作", "1 hand move": "1 个手部动作", "Left hand to hold {}": "左手到 {} 号点", "Right hand to hold {}": "右手到 {} 号点", "Start: both hands on": "起步：双手上点", "Hands on the first holds, feet low. The numbers go up the wall in the order Leo used them.": "双手抓第一组岩点，脚放低。数字按 Leo 用点的顺序往上排。", "Feet stay where they are. Just reach.": "脚不动，直接伸手。", "First move your left foot (the white square). Then reach.": "先动左脚（白色方块），再伸手。", "First move your right foot (the white square). Then reach.": "先动右脚（白色方块），再伸手。", "First move your left foot, then your right foot (the white squares). Then reach.": "先动左脚，再动右脚（白色方块），然后伸手。", "First move your right foot, then your left foot (the white squares). Then reach.": "先动右脚，再动左脚（白色方块），然后伸手。", "First move your {} (the white squares). Then reach.": "先按顺序动脚（白色方块），再伸手。", "read from the green holds": "从绿色岩点读出", "read from the orange holds": "从橙色岩点读出", "Beta": "Beta", "hand and foot moves": "手和脚的动作数", "This is how Leo climbed it": "这是 Leo 的爬法", "Topped in {}": "{} 登顶", "read from their video. Watch it": "从 Leo 的视频读出，点开看", "Other climbers on {}": "{} 上的其他人", "your own way may differ": "你的爬法可以不一样", "Film a try on it": "拍一条试试", "With the Spotter camera": "用 Spotter 相机拍", "All three sample tries are filmed": "三条示例视频都拍过了", "A video from your camera roll": "从相册选视频", "No video or photo needed": "不需要视频或照片", "Start and stop filming from your wrist": "用手腕控制开始和停止拍摄", "Connected · starts and stops filming": "已连接 · 控制开始和停止拍摄", "Which route?": "哪条线？", "I topped it": "我登顶了", "Didn’t top · +1 attempt": "没登顶 · 记一次尝试", "+1 attempt": "记一次尝试", "the clock starts with your first try": "第一次尝试时开始计时", "Nothing yet. Film, import or log a try and it shows up here.": "还没有。拍一条、导入一条或记一次，就会显示在这里。", "Video · analysis ready": "视频 · 分析好了", "Video · analysing": "视频 · 分析中", "Video · check who Spotter followed": "视频 · 确认 Spotter 跟对了人", "Video": "视频", "This session": "这次攀爬", "Not started": "还没开始", "The clock starts with your first try.": "第一次尝试时开始计时。", "Phone on the floor, whole route in frame. Spotter reads the route from the holds.": "手机放地上，整条线入镜。Spotter 会从岩点读出是哪条线。", "Didn’t film it?": "没拍视频？", "log it by hand": "手动记一下", "analysis ready": "分析好了", "Check who Spotter followed": "确认 Spotter 跟对了人", "Connected · your wrist starts and stops each video": "已连接 · 用手腕控制每段视频的开始和结束", "Start and stop each video from your wrist": "用手腕控制每段视频的开始和结束", "Connected": "已连接", "Connect": "连接", "How the watch works": "手表怎么用", "Four screens, on your wrist": "手腕上的四个画面", "Tries you filmed before, from your camera roll": "之前拍的尝试，从相册导入", "Climb": "攀爬", "Session": "攀爬中", "Try saved · analysing it now": "已保存 · 正在分析", "Climb here now": "现在在这里爬", "Film a try or log one, with the session clock": "拍一条或记一次，带计时", "Start a session": "开始攀爬", "tap the picture for the analysis": "点图片看分析", "Not topped · analysis ready": "未登顶 · 分析好了", "Topped · analysis ready": "登顶 · 分析好了", "Not topped · {}": "未登顶 · {}", "Topped · {}": "登顶 · {}", "{} · logged by hand": "{} · 手动记录", "{} · {} videos": "{} · {} 个视频", "{} · 1 video": "{} · 1 个视频", "your videos": "你的视频", "rope wall with videos": "有视频的顶绳墙", "{} routes with videos": "{} 条线路有视频", "1 route with videos": "1 条线路有视频", "No one has filmed at these yet, so Spotter shows only what the gym publishes.": "还没人在这些馆拍过，所以 Spotter 只显示场馆自己公布的信息。", "Open till {}": "营业到 {}", "Closed · opens {}": "已关门 · {} 开门", "{} gyms within {} mi": "{1} 英里内有 {0} 家馆", "1 gym within {} mi": "{} 英里内有 1 家馆", "Mon–Sat": "周一至周六", "$16 college students": "大学生 $16", "$18 if 20 or under": "20 岁及以下 $18", "$17 kids 10 and under": "10 岁及以下儿童 $17", "Shoe rental $4": "租鞋 $4", "Free fitness classes": "免费健身课", "Same pass works at {}": "{} 也能用同一张票", "200+ problems across both gyms": "两家馆共 200 多条抱石线", "New climbs every week": "每周都有新线路", "Showers and sauna": "淋浴和桑拿", "Study space": "自习区", "Top rope and auto belays": "顶绳和自动保护器", "Outdoor silo wall": "户外筒仓岩壁", "Fitness area": "健身区", "Spotter’s routes and side by sides are at {} for now.": "Spotter 的线路和并排对比目前只在 {}。", "Plan a session here": "在这里约一场", "Your friends see it and can join": "朋友能看到并加入", "Climbed one without a video? Log an attempt or a send": "爬了但没拍？记一次尝试或完攀", "You topped it before": "你之前登顶过", "Climbed without filming? Log it here. Your videos count on their own.": "没拍视频？在这里记录。有视频的尝试会自动算进去。", "{} attempts": "{} 次尝试", "1 attempt": "1 次尝试", "{} attempts today": "今天 {} 次尝试", "1 attempt today": "今天 1 次尝试", "Climbing now": "正在攀爬", "{} sends today": "今天 {} 次完攀", "1 send today": "今天 1 次完攀", "1 try": "1 次尝试", "Climbing for {}": "已爬 {}", "Open the session": "打开这次攀爬", "Public climbs are in Community at {}, where climbers can comment. Hidden ones stay with you.": "公开的攀爬会出现在 {} 的社区里，大家可以评论。隐藏的只有你能看到。", "Next time, film a try or log one, and it shows up here.": "下次拍一条或记录一次，就会显示在这里。", "CSV with every attempt, send and video": "CSV，包含每次尝试、完攀和视频", "{} friends": "{} 位朋友", "1 friend": "1 位朋友", "0 friends": "0 位朋友", "Compared with the grade on the route. Climbers looking at it see what everyone said.": "和这条线标的难度比。看这条线的人能看到大家的评价。", "first go today": "今天第一次", "after {} attempts": "已尝试 {} 次后", "after 1 attempt": "已尝试 1 次后", "They get a link to send you the video. Spotter reads your moves from it.": "他们会收到链接，把视频发给你。Spotter 会从视频里读出你的动作。", "Follow climbers in Community and they show up here.": "在社区关注攀岩者，他们就会出现在这里。", "attempt {} today": "今天第 {} 次尝试", "asked {} for the video": "已请 {} 发视频", "Connect a watch": "连接手表", "Phone": "手机", "filming when you start": "你一开始就拍", "Press to start climb {}": "按下开始第 {} 次攀爬", "Filming on your phone": "正在用手机拍", "Press when you’re down": "落地后按一下", "Saved · {}": "已保存 · {}", "Climb 1 · on video": "第 1 次攀爬 · 有视频", "Step in and check you’re in frame on your wrist. Then press the orange Action button.": "走进画面，在手腕上确认你在镜头里，然后按橙色的操作按钮。", "Nothing to answer. Your phone reads the route and analyses the video.": "什么都不用回答。手机会读出线路并分析视频。", "Once it’s read, the route shows here. Rest counts up: press when you’re ready.": "读出来后线路会显示在这里。休息时间往上数：准备好了就按。", "Wrong route?": "线路不对？", "Change it on the video later. The watch never asks while you climb.": "之后在视频里改。爬的时候手表从不打扰你。", "Watch ready": "手表已就绪", "Use a watch": "用手表", "Watch connected · start each try from your wrist": "手表已连接 · 用手腕开始每次尝试", "As a poster, with the route and gym on it": "做成海报，带线路和场馆", "Route, grade and gym added from the video": "线路、难度和场馆从视频里自动加上", "On the wall": "在墙上", "{} seconds, labels added": "{} 秒，已加标注", "{} seconds": "{} 秒", "labels added for you": "已为你加好标注", "Send to {} and {}": "发给 {0} 和 {1}", "Send to {}": "发给 {}", "Sent to {} and {}": "已发给 {0} 和 {1}", "Sent to {}": "已发给 {}", "{} rows": "{} 行", "1 row": "1 行", "Sample people: names and free days are made up. The videos are real.": "示例人物：名字和空闲日是编的，视频是真的。", "{} and {} are going": "{0} 和 {1} 会去", "{} is going": "{} 会去", "You planned · {} invited": "你发起的 · 邀请了 {}", "Climbing at {}": "在 {} 攀岩", "{} videos at {}": "在 {1} 有 {0} 个视频", "1 video at {}": "在 {} 有 1 个视频", "climbing {}": "攀岩 {}", "5–10 years": "5–10 年", "over 10 years": "10 年以上", "1–2 years": "1–2 年", "2–5 years": "2–5 年", "{} is closed that day.": "{} 那天不开门。", "Plan posted · {}": "约爬已发布 · {}", "You’re going · {}": "你会去 · {}", "Opening {} in Maps": "在地图中打开 {}", "Topped · {}": "登顶 · {}", "Mon–Thu": "周一至周四", "Sat–Sun": "周六至周日", "Mon–Fri": "周一至周五", "Version 9 · climbing videos: The Way Up (Maschek & Schedl, CC BY 4.0), shown as if filmed at the ARC · gym photos, address and hours from campusrec.illinois.edu (Nov 2026) · names, grades, likes and comments are sample; every climbing number is measured from the videos": "第 9 版 · 攀岩视频：The Way Up（Maschek & Schedl，CC BY 4.0），当作在 ARC 拍摄 · 场馆照片、地址和开放时间来自 campusrec.illinois.edu（2026 年 11 月）· 名字、难度、点赞和评论是示例；所有攀岩数据都从视频中测得", "Green 5.8": "绿线 5.8", "Orange 5.9": "橙线 5.9", "ARC Climbing Wall": "ARC 攀岩墙", "Rope wall": "顶绳墙", "rope wall": "顶绳墙", "Top rope": "顶绳", "top rope": "顶绳", "Film a try at {} or import one from your camera roll. Spotter finds every move and shows you others on the same route.": "在 {} 拍一条，或从相册导入。Spotter 会找出每一个动作，并给你看同一条线上的其他人。", "{} climbers on it": "{} 位攀岩者爬过", "1 climber on it": "1 位攀岩者爬过", "Topped on try {}": "第 {} 次登顶", "Not topped yet": "还没登顶", "{} tries on video": "{} 次尝试有视频", "1 try on video": "1 次尝试有视频", "{} of {} routes topped": "{1} 条线登顶了 {0} 条", "Your tries at {}, each one analysed": "你在 {} 的每次尝试，逐条分析", "Didn’t top": "未登顶", "not topped": "未登顶", "See what your body did on the wall": "看清你在墙上的每个动作", "Film a try with your phone on the floor. Spotter follows your hands, feet and hips, then shows you the same route climbed by others at {}.": "把手机放在地上拍一条。Spotter 跟踪你的手、脚和髋部，再给你看 {} 的其他人爬同一条线。", "found in Leo’s climb of Green 5.8, with how long each rest was and where the hips were": "来自 Leo 爬绿线 5.8 的视频，还有每次休息多久、髋部在哪里", "Your videos are public at first: climbers at {} can watch them and comment. Hide any video, anytime.": "你的视频默认公开：{} 的攀岩者可以观看和评论。任何视频都可以随时隐藏。", "Look around first": "先随便看看", "Add a try": "添加一次尝试", "Phone on the floor, whole route in frame": "手机放地上，整条线入画", "Import": "导入", "Videos from your camera roll": "相册里的视频", "Camera roll": "相册", "climbing videos": "攀岩视频", "Spotter reads the day, the gym and the route from each video. Only the videos you pick leave your phone.": "Spotter 会从每个视频读出日期、场馆和线路。只有你选的视频会离开手机。", "Import {} videos": "导入 {} 个视频", "Import 1 video": "导入 1 个视频", "Every climbing video in your camera roll is in Spotter already.": "相册里的攀岩视频都已经在 Spotter 里了。", "{} videos imported": "已导入 {} 个视频", "analysing": "分析中", "Read from the holds in frame": "从画面里的岩点识别", "This prototype has three sample tries of yours, and all three are in Videos already.": "这个原型里你有三条示例尝试，三条都已经在视频里了。", "Recording. Tap stop when you’re back on the ground.": "正在录制。回到地面后点停止。", "Prop the phone up on the floor so the whole route fits, then tap once.": "把手机立在地上，让整条线都入画，然后点一下。", "Compare": "对比", "Same route, other climbers": "同一条线，其他攀岩者", "{} climbing": "攀爬 {}", "Side by side, both from the first move, with what Spotter counted in each video.": "并排播放，都从第一个动作开始，附上 Spotter 在每条视频里数出的数据。", "Route": "线路", "read from the holds in frame": "从画面里的岩点识别", "from where it was filmed": "根据拍摄地点", "Not in Community. Only you can see it": "不在社区里，只有你能看到", "In Community: climbers here can watch it and comment": "在社区里：这里的攀岩者可以观看和评论", "Hidden": "已隐藏", "Wrong person followed? Show Spotter where you are": "跟错人了？告诉 Spotter 你在哪", "It stays in your camera roll": "相册里的原视频还在", "Watch it next to someone else": "和别人并排看", "{} other climbers on {}": "{1} 上还有 {0} 位攀岩者", "1 other climber on {}": "{} 上还有 1 位攀岩者", "Is this you on {}?": "这是你在 {} 上吗？", "Loading…": "加载中…", "Waiting for your analysis…": "等你的分析完成…", "Climbing time": "攀爬时间", "Hand moves": "手部移动", "Foot moves": "脚部移动", "Feet per hand move": "每次手移动对应的脚步", "Counted by Spotter from both videos, from the first move to the last.": "由 Spotter 从两条视频中统计，从第一个动作到最后一个。", "{}’s video ends before the top, so their time is for less of the route.": "{} 的视频在到顶前就结束了，所以时间只算了一部分线路。", "Your video ends before the top, so your time is for less of the route.": "你的视频在到顶前就结束了，所以时间只算了一部分线路。", "{} moved a foot {} times for every hand move, you {}. Step your feet up before you reach: legs push, arms only hold.": "{0} 每移动一次手就移动 {1} 次脚，你是 {2} 次。伸手前先把脚抬上去：腿来推，手只负责抓。", "{} kept their hips over their feet for {} of the climb, you for {}. When your hips drift to one side, your arms take the weight.": "{0} 在 {1} 的时间里髋部在脚上方，你是 {2}。髋部偏到一边时，重量就落到了手臂上。", "You were moving {} of the time, {} {}. {} stopped more to look up and pick the next hold.": "你有 {0} 的时间在移动，{1} 是 {2}。{3} 停下来看路、选下一个点的时间更多。", "{} climbed it in {}, you in {}. Watch where they go straight on and where you go back.": "{0} 用了 {1}，你用了 {2}。看看哪里他们直接往上，而你退回去了。", "Your numbers are close to {}’s. Watch the two side by side, slowed down, and look at where each foot goes.": "你和 {} 的数据很接近。放慢并排看，注意每只脚踩在哪里。", "Compare with someone else": "换个人对比", "Compare your try with {}": "把你的尝试和 {} 对比", "not topped yet": "还没登顶", "Climbers on it": "爬过这条线的人", "{} of {} topped": "{1} 人中 {0} 人登顶", "VS puts your latest try, try {}, next to theirs.": "VS 会把你最新的一次（第 {} 次）和他们的并排放。", "Film or import a try on this route to compare it with theirs.": "在这条线上拍一条或导入一条，就能和他们对比。", "Routes get reset: this one is on the wall as long as the gym keeps it.": "线路会重新定线：只要场馆保留，它就在墙上。", "Then watch it next to anyone below": "然后和下面任何人并排看", "Routes with videos": "有视频的线路", "{} climbers filmed it": "{} 位攀岩者拍过", "{} tries of yours": "你的 {} 次尝试", "1 try of yours": "你的 1 次尝试", "Only routes someone has filmed with Spotter. Routes get reset, so the wall may look different today.": "只显示有人用 Spotter 拍过的线路。线路会重新定线，今天的墙可能不一样了。", "0.6 mi from the Quad": "距离 Quad 0.6 英里", "Membership, belay class and hours": "会员、保护课程和开放时间", "35.5 ft rope wall": "35.5 英尺顶绳墙", "Bouldering Cave with a Kilter Board": "抱石洞，有 Kilter Board", "Hangboards": "指力板", "Closed Nov 21–29 for Fall Break.": "秋假 11 月 21–29 日闭馆。", "Copy the address": "复制地址", "Second lap today, kept it slow": "今天第二趟，慢慢爬", "Smooth top out": "到顶好顺", "That rest at the bulge though": "那个凸起处的休息太稳了", "Came off near the top again. Next time": "又在快到顶的地方掉了。下次吧", "Same spot as me!": "和我掉在同一个地方！", "Took every rest I could find": "能休息的地方都休息了", "Patience pays": "耐心有回报", "Pumped out up high": "上面爆前臂了", "The top is so sustained": "上半段一直很累", "Warm-up": "热身", "Finally clipped the anchor on this one": "终于爬到顶挂上锚点了", "How did you do the last move?": "最后一步怎么做的？", "Trying to keep my feet quiet": "尽量让脚步轻一点", "Lowered off before the top. Working on it": "到顶前就下来了，还在练", "Trust your feet in the middle, there are good holds low": "中段相信你的脚，下面有好点", "Hips close to the wall, it’s less steep than it looks": "髋部贴墙，没看起来那么陡", "Nearly there, the top is the crux for me too": "快了，顶上对我来说也是难点", "So much smoother than last week": "比上周顺多了", "What did you change at the top?": "顶上你改了什么？", "Climbs at {}": "在 {} 攀岩", "Your try {} and {}’s": "你的第 {0} 次和 {1} 的", "Sample person: the name and words are made up. The videos are real.": "示例人物：名字和文字是虚构的，视频是真实的。", "On video": "有视频", "{} analysed so far": "已分析 {} 条", "routes with videos here": "这里有视频的线路", "Try {} topped": "第 {} 次登顶", "Try {} not topped": "第 {} 次未登顶", "Your body, try by try": "每次尝试的身体数据", "oldest first": "从最早开始", "From each analysed video, first move to last. G = Green, O = Orange, then the try.": "来自每条已分析的视频，从第一个动作到最后一个。G = 绿线，O = 橙线，后面是第几次。", "Who sees your videos": "谁能看到你的视频", "New videos": "新视频", "Public: in Community at {}": "公开：在 {} 的社区里", "Only you, until you make one public": "仅自己可见，直到你公开某一条", "{} videos hidden": "{} 个视频已隐藏", "1 video hidden": "1 个视频已隐藏", "Only you can see them. Change it on each video": "只有你能看到。在每条视频里修改", "Only you can see it. Change it on each video": "只有你能看到。在每条视频里修改", "Film or import a try and your progress shows up here.": "拍一条或导入一条，你的进步就会显示在这里。", "Hidden · only you can see it": "已隐藏 · 只有你能看到", "Public · in Community": "已公开 · 在社区里", "Moved to {}": "已移到 {}", "Video deleted": "视频已删除", "New videos will be public": "新视频将会公开", "New videos will be only for you": "新视频将仅自己可见", "Delete this video?": "删除这条视频？", "{}. Its analysis and comments go too. The video stays in your camera roll.": "{}。它的分析和评论也会删除。相册里的原视频还在。", "{} other tries of yours": "你的另外 {} 次尝试", "1 other try of yours": "你的另外 1 次尝试", "0 other tries of yours": "你没有其他尝试", "A climber on the rope wall, with the body Spotter found drawn on": "顶绳墙上的攀岩者，画出了 Spotter 识别到的身体", "opens tomorrow {}": "明天 {} 开门", "opens {}": "{} 开门", "Directions · {}": "路线 · {}", "Plan a route": "规划线路", "Photo a wall, moves for your height": "拍一面墙，按你的身高规划动作", "Find by tag": "按标签找线", "Nothing logged today.": "今天还没记录。", "Nothing logged today. Swipe a route above, or tap it.": "今天还没记录。在上面的线路上滑动，或点开它。", "{} V?": "{} V?", "Climbing now · {}": "正在攀爬 · {}", "{} so far": "已经 {}", "Film or log a climb with Add and it shows up here right away.": "用 Add 拍一条或记一笔，马上就会出现在这里。", "height not set": "未填身高", "an average height (165 cm) until you add yours in Profile": "平均身高（165 cm），在 Profile 里填上你的就会按你的算", "For an average height and reach (165 cm), as yours isn’t set.": "按平均身高和臂展（165 cm）算，因为你还没填。", "of your tries: highest move and time on each move": "你的尝试：最高到第几步、每步用时", "{} h": "{} 小时", "Reply": "回复", "Nice send!": "完攀漂亮！", "What was the beta at the top?": "顶上那段怎么爬的？", "Trust your feet": "相信你的脚", "Same route tomorrow?": "明天一起爬这条？", "At {} in the video": "标在视频 {}", "Hardest send today:": "今天最难的完攀：", "· your hardest yet": "· 你目前最难的", "logged by hand": "手动记录", "Next time, film a try or log one on Log a climb, and it shows up here.": "下次拍一条，或在“记录攀爬”里记一笔，就会出现在这里。", "Hanging on straight arms uses your skeleton, not your muscles, so you tire later.": "直臂挂着靠的是骨架而不是肌肉，能撑得更久。", "Your weight is on your legs, which are stronger than your arms.": "重量压在腿上，腿比手臂有力得多。", "The rest of the time you were still: reading the route, resting or stuck.": "其余时间你没在动：在看线、休息或卡住了。", "Next": "接下来", "Film it again": "再拍一次", "Film another try": "再拍一次尝试", "{} · the camera opens on this route": "{} · 相机直接对准这条线", "Watch it next to {}": "和 {} 并排看", "Same route, side by side": "同一条线，并排对比", "Full screen": "全屏", "Try next time": "下次试试", "{} moved their feet {} more times in the same {} s. Try small foot steps up before each reach.": "同样 {2} 秒里，{0} 多挪了 {1} 次脚。每次伸手前先用小步把脚往上挪。", "You made {} more hand moves than {}. Look for the next hold before you let go.": "你比 {1} 多出了 {0} 次手。松手前先看好下一个点。", "{} got to the next shared hold in {} s, you in {} s, with {} from you. Plan the sequence from the ground first.": "{0} 到下一个共同用的点用了 {1} 秒，你用了 {2} 秒，你多了 {3}。上墙前先在地上把顺序想好。", "more hand move": "次手部动作", "more hand moves": "次手部动作", "{} vs {}": "{} vs {}", "In Community": "已发到社区", "Posted · see likes and comments": "已发布 · 看点赞和评论", "Say something (optional)": "说点什么（可选）", "Caption": "配文", "Post": "发布", "Share this try": "分享这次尝试", "Share your progress": "分享你的进度", "Back to {}": "回到{}", "Analyse · next video": "分析 · 下一个", "{} is being analysed · it’s in Videos": "{} 正在分析 · 在视频页里", "Video {}": "视频 {}", "Video {}, done": "视频 {}，已完成", "Watch the send": "看这次完攀", "I topped try {}": "第 {} 次完攀了", "Add a note to this send": "给这次完攀加备注", "Got a video of the send? Spotter reads your moves from it.": "有这次完攀的视频吗？Spotter 能从里面读出你的动作。", "From Photos": "从相册", "No video": "没有视频", "For you · {}": "适合你 · {}", "New to logging?": "第一次记录？", "Routes around your level ({}) are first.": "适合你水平（{}）的线路排在最前面。", "Got it": "知道了", "Undone": "已撤销", "{} · attempt {}": "{} · 第 {} 次尝试", "Session done": "这次攀爬结束", "{} · {} on the clock": "{} · 用时 {}", "Hardest send": "最难完攀", "Nothing logged.": "没有记录。", "It’s in your Logbook on Profile.": "已存到 Profile 的攀岩记录里。", "Session saved to your Logbook": "已存到攀岩记录", "Snap the tag": "拍线路标签", "Point at the tape on the start hold": "对准起步点上的标签", "Snap a tag": "拍标签", "Read from the tag · {}, {}": "从标签识别 · {}，{}", "Attempt +1": "尝试 +1", "Yours": "你的线路", "All routes": "全部线路", "attempts": "尝试", "Swipe right on a route to log a send, left for an attempt. Tap it for more.": "在线路上右滑记完攀，左滑记一次尝试；点开看更多。", "your gym": "你的岩馆", "Where are you climbing?": "你在哪爬？", "Nearest first": "由近到远", "{} today": "今天 {}", "Attempt · {}": "尝试一次 · {}", "Open {}": "打开 {}", "Climbed one without a video? Pick it from this gym’s routes and log an attempt or a send.": "没拍视频？从这家岩馆的线路里选，记一次尝试或完攀。", "{} days ago": "{} 天前", "Routes": "线路", "Classics": "经典", "All grades": "全部难度", "Colour": "颜色", "Every wall": "所有墙", "No routes match. Turn a filter off.": "没有符合的线路，关掉一个筛选试试。", "Sample routes. In the real app the gym’s setters keep this list current, so a wall that’s reset shows its new routes.": "示例线路。正式版由岩馆定线员维护这份列表，墙换线后会显示新线路。", "You topped it": "你完攀了", "You: {}": "你：{}", "Show every wall": "显示所有墙", "Your history": "你的记录", "Attempts": "尝试", "Sends": "完攀", "Log send": "记录完攀", "Attempt": "尝试一次", "Attempt {} logged": "已记录第 {} 次尝试", "Rate the climb": "给这条线打分", "How": "方式", "Flash": "一次完攀", "Redpoint": "多次完攀", "Flash: sent on your first go.": "Flash：第一次就完攀。", "Redpoint: sent after trying it before.": "Redpoint：之前试过，这次完攀。", "The grade felt": "难度感觉", "Spot on for {}": "就是 {}", "Logbook": "攀岩记录", "Tops rate": "完攀率", "Day before": "前一天", "Day after": "后一天", "Nothing logged today. On a route, tap Attempt or Log send.": "今天还没记录。在线路页点「尝试一次」或「记录完攀」。", "Nothing logged this day.": "这天没有记录。", "No tips yet. Film a try and the app reads your moves.": "还没有攻略。拍一条，app 会读出你的动作。", "Start matched, then trust your feet.": "双手同点起步，然后相信你的脚。", "Keep your hips close on the last two moves.": "最后两步让髋贴近墙。", "Big moves, good holds. Commit to the top.": "动作大、点好抓，果断冲顶。", "Not topped": "未完攀", "Grade not given": "没写难度", "Route not tagged": "没标线路", "Compare with your try": "和你的那次对比", "No one has posted a video of this route. Post your send and yours is the first.": "这条线还没人发过视频。发你的完攀，你就是第一个。", "No one has posted a video of this route. Film a try and yours is the first.": "这条线还没人发过视频。拍一条，你就是第一个。", "No beta yet": "还没人发视频", "No one has posted a video of this route. Yours would be the first.": "这条线还没人发过视频，你会是第一个。", "Film it": "拍一条", "Past week": "最近一周", "Past month": "最近一个月", "All time": "全部", "No videos from here yet": "这里还没有视频", "No videos from here today": "今天这里还没有视频", "No videos from here in the {}": "{}这里没有视频", "Post one of your sends. It might help someone stuck on the same route.": "发一条你的完攀，也许能帮到卡在同一条线上的人。", "See all {}": "看全部 {}", "Open now": "营业中", "Closed now": "已关门", "Colours": "按颜色", "V grade tags": "V 级标签", "Hours": "营业时间", "Here": "设施", "Waiver, passes and classes": "签协议、买票、报课", "Directions · {} ↗": "导航 · {} ↗", "Copy": "复制", "Address copied": "地址已复制", "Hours today": "今天营业", "Not listed": "没写", "Grades": "难度", "Colour circuit: the hold colour is the grade range": "按颜色分级：岩点颜色就是难度区间", "A tag on each climb: V0 is the easiest": "每条线有难度标签：V0 最简单", "We don’t know yet": "暂时不知道", "Open · till {}": "营业中 · 到 {}", "From {}, Nov 2026.": "来自 {}，2026 年 11 月。", "{} now": "现在{}", "All set · Show": "都准备好了 · 展开", "soft": "偏软", "spot on": "刚好", "hard": "偏硬", "Soft": "偏软", "Spot on": "刚好", "Hard": "偏硬", "How much did you like it?": "你有多喜欢这条线？", "Compared with the grade on the tag. Climbers looking at this route see what everyone said.": "和标签上的难度比。看这条线的人能看到大家的评价。", "Most say it’s soft for a {}": "多数人觉得以 {} 来说偏软", "Most say it’s hard for a {}": "多数人觉得以 {} 来说偏硬", "Most say it’s a fair {}": "多数人觉得是标准的 {}", "You said {}": "你选了 {}", "From {} who logged a send on Spotter": "来自在 Spotter 记录过完攀的 {}", "Your first visit": "第一次来", "{} of {} left": "还剩 {} / {} 项", "All set": "都准备好了", "Sign the waiver": "签免责协议", "Gyms ask for one before your first climb. It’s usually on their website.": "第一次攀爬前岩馆会要你签，一般在他们官网上。", "Gyms ask for one before your first climb. Ask at the desk.": "第一次攀爬前岩馆会要你签，问前台。", "Get a day pass": "买单次票", "{}, at the desk": "{}，在前台买", "Ask at the desk": "问前台", "Climbing shoes": "攀岩鞋", "{}. Ask for your street size": "{}。报你平时穿的鞋码", "Ask at the desk if they rent shoes": "问前台能不能租鞋", "Ask for a quick intro": "请工作人员简单介绍一下", "Staff can show you how to fall and get down safely. Ask at the desk.": "工作人员可以教你怎么摔、怎么安全下来。问前台。", "Go when it’s quiet": "挑人少的时候去", "Today it’s usually quietest around {}m, from check-ins": "今天通常 {}m 左右人最少，来自签到数据", "Waiver, passes and classes on {}": "在 {} 签协议、买票、报课", "Prices and rentals from {}, Nov 2026.": "价格和租借信息来自 {}，2026 年 11 月。", "Follow-cam video": "跟拍视频", "Make": "生成", "Follow-cam video ready": "跟拍视频好了", "Keeps going if you leave this page": "离开这个页面也会继续", "Making your follow-cam video · {}": "正在生成跟拍视频 · {}", "{} · zoomed in on you": "{} · 镜头跟着你", "The camera follows you, zoomed in. {} of climbing": "镜头放大跟着你走。共 {} 的攀爬", "Couldn’t make the video": "没能生成视频", "This browser can’t record video. Try Chrome or Safari": "这个浏览器不能录视频，换 Chrome 或 Safari 试试", "Both start as your first foot leaves the ground.": "两段都从你第一只脚离地开始。", "In the first {} s off the ground": "离地后的前 {} 秒", "Counted by Spotter from both videos.": "由 Spotter 从两段视频里数出来。", "Both start on the same hold. Watch how each of you gets to the next hold you both used.": "两段都从同一个点开始。看你们各自怎么到下一个你们都用过的点。", "From that hold to the next one you both used": "从这个点到下一个你们都用过的点", "Arms: 180° is straight. Under 145° counts as bent.": "手臂：180° 是伸直，小于 145° 算弯曲。", "Tap play on the video": "点视频播放", "Not always a mistake: you may be hanging off a hold or setting up the next move.": "不一定是错：你可能是在挂着休息，或者在为下一步做准备。", "Your hips stayed right of your feet from {}.": "你的髋部在脚的右边，从 {}。", "Your hips stayed left of your feet from {}.": "你的髋部在脚的左边，从 {}。", "Hand and foot moves": "手脚动作", "As it plays": "边播边看", "{} on video · {} to check": "{0} 视频 · {1} 条待确认", "{} on video · newest first": "{} 视频 · 最新的在前", "Climb {} next": "下一次：第 {} 次攀爬", "Climb {}": "第 {} 次攀爬", "Press the orange button on your watch when you’re down": "下来后按一下手表上的橙色按钮", "Your watch starts recording · screen stays on, dimmed": "由手表开始录制 · 屏幕保持常亮、调暗", "Prop the phone up so the whole route fits. Then press the orange button on your watch to start climb 1.": "把手机架好，让整条线路都在画面里，然后按手表上的橙色按钮开始第 1 次攀爬。", "Reading…": "读取中…", "or tap here": "或点这里", "Session ended on your watch too": "手表上也已结束", "Start climb {}": "开始第 {} 次攀爬", "Stop climb {}": "结束第 {} 次攀爬", "Apple Health": "Apple 健康", "Each session saves as a Climbing workout: time, heart rate and calories, each climb a segment. Asks once.": "每一场存成一次“攀岩”体能训练：时长、心率和卡路里，每次攀爬是一个分段。只问一次。", "Press the orange button again when you’re down, or double tap.": "下来后再按一次橙色按钮，或者双指捏两下。", "Check the frame": "确认取景", "Your phone’s camera, on your wrist: step in and check you’re in frame. Then press the orange Action button.": "手机的画面会显示在手腕上：走进画面，确认拍得到自己，然后按橙色的操作按钮。", "Press the orange button again when you’re down, or double tap. One buzz to start, two to stop: no need to look.": "下来后再按一次橙色按钮，或者双指捏两下。开始震一下、结束震两下，不用看表。", "Once it’s read, the route and your try on it show here. Rest counts up: press when you’re ready.": "读完后这里会显示线路和这是第几次。休息时间只往上计，准备好了就按。", "From your first climb to End, rest included.": "从第一次攀爬到结束，包括休息。", "Open the watch prototype": "打开手表原型", "The watch app on its own page, full size": "单独一页的手表 app，原尺寸", "Your phone films from the floor. Your wrist starts and stops each try, so every video is one try.": "手机放在地上拍，手腕负责开始和结束每一次尝试，所以每段视频就是一次尝试。", "Your Apple Watch": "你的 Apple Watch", "Connected · starts and stops each try": "已连接 · 开始和结束每次尝试", "tap the watch": "点一下手表", "Filming": "录制中", "I’m down": "我下来了", "Reading it on your phone": "手机正在读取", "Last try: hold {} of {}": "上一次：第 {}/{} 个点", "Start try {}": "开始第 {} 次", "Tap Start as you step on. Your phone, on the floor, starts filming.": "上墙时点开始，地上的手机开始录。", "Tap when you’re down. The video is cut to just this try.": "下来后点一下，视频只剪这一次尝试。", "Nothing to answer. Your phone reads the route and how high you got.": "什么都不用回答，手机会读出线路和你爬到的高度。", "Your last try shows here once it’s read. Rest counts up: go again when you’re ready.": "读完后这里会显示上一次的结果。休息时间只往上计，准备好了再爬。", "Climbing": "攀爬中", "Saved": "已保存", "Resting": "休息中", "Wrong route or try?": "线路或次数不对？", "Fix it on the video later. The watch never asks while you climb.": "之后在视频里改就行，爬的时候手表不会问你。", "From your first Start to End, rest included.": "从第一次点开始到结束，包括休息。", "Tap Start on your watch before each try": "每次尝试前在手表上点开始", "Tap Start on your watch when you’re ready": "准备好了在手表上点开始", "Start filming when you’re ready": "准备好了就开始录", "Watch connected · tap Start before each try": "手表已连接 · 每次尝试前点开始", "Tap the watch: next screen": "点手表：下一屏", "Earlier": "更早", "This week": "本周", "Last week": "上周", "No gym": "无岩馆", "hardest V2, {} at V3 so far": "最难 V2，目前在 V3 有 {}", "World Cup Munich 2019 {}": "2019 慕尼黑世界杯 {}", "Jan": "1 月", "Feb": "2 月", "Mar": "3 月", "Apr": "4 月", "May": "5 月", "Jun": "6 月", "Jul": "7 月", "Aug": "8 月", "Sep": "9 月", "Oct": "10 月", "Nov": "11 月", "Dec": "12 月", "January": "1 月", "February": "2 月", "March": "3 月", "April": "4 月", "June": "6 月", "July": "7 月", "August": "8 月", "September": "9 月", "October": "10 月", "November": "11 月", "December": "12 月", "Arms straight, resting": "休息时手臂伸直", "Your arms only read clearly when you stop, so that one counts your rests.": "手臂只有在你停下来时才看得清，所以这一项只算休息时。", "Also measured": "其他测量", "Reached hold {}": "到第 {} 个点", "Hold {}/{}": "第 {}/{} 点", "Playback speed": "播放速度", "Champaign": "香槟市", "{} open now": "{} 家正在营业", "all closed now": "现在都已关门", "Arms now": "手臂（此刻）", "Hips now": "髋部（此刻）", "read from the video": "从视频读出", "Post and finish": "发布并完成", "session since {}": "次 · 自 {} 起", "sessions since {}": "次 · 自 {} 起", "Purple V2 · {} videos, last climbed {}": "紫色 V2 · {} 个视频，上次爬 {}", "January so far": "1 月至今", "January recap": "1 月回顾", "February so far": "2 月至今", "February recap": "2 月回顾", "March so far": "3 月至今", "March recap": "3 月回顾", "April so far": "4 月至今", "April recap": "4 月回顾", "May so far": "5 月至今", "May recap": "5 月回顾", "June so far": "6 月至今", "June recap": "6 月回顾", "July so far": "7 月至今", "July recap": "7 月回顾", "August so far": "8 月至今", "August recap": "8 月回顾", "September so far": "9 月至今", "September recap": "9 月回顾", "October so far": "10 月至今", "November recap": "11 月回顾", "December so far": "12 月至今", "December recap": "12 月回顾", "Alex and Jo are both free tomorrow.": "Alex 和 Jo 明天都有空。", "Add the people you climb with, then pick a gym and a time together.": "加上一起爬的朋友，再一起选岩馆和时间。", "Find friends": "找朋友", "none yet": "还没有", "See each other’s climbs and plan sessions together.": "互相看到彼此的攀爬，一起约时间去爬。", "Climbing soon": "近期约爬", "Plan one": "约一次", "Going": "要去", "Nothing planned. Plan a session and your friends can join.": "还没有约。约一次，朋友就能加入。", "Add a friend, then plan a session together.": "先加朋友，再一起约。", "this week": "本周", "Friends’ climbs": "朋友的攀爬", "Your friends haven’t posted a climb yet.": "朋友们还没发过攀爬。", "Climbs your friends post show up here.": "朋友发的攀爬会出现在这里。", "Add friends": "加朋友", "Friends see your climbs and can join your sessions.": "朋友能看到你的攀爬，也能加入你约的场次。", "From your contacts": "通讯录里的人", "Copy an invite link": "复制邀请链接", "Plan a session": "约一次攀爬", "Your friends see it and can join.": "朋友会看到，并可以加入。", "Where": "在哪", "When": "什么时候", "Ask": "叫上谁", "Post plan": "发出", "Tomorrow": "明天", "You planned it": "你发起的", "No one yet.": "还没有人。", "Plan cancelled": "已取消", "You left the plan": "你已退出", "V grades on a tag": "V 级难度牌", "Each climb has a tag with V and a number: V0 is the easiest.": "每条线路有一张写着 V 和数字的牌子：V0 最简单。", "Hours not listed": "未公布营业时间", "Closed today": "今天休息", "Closed": "休息中", "Not too busy": "人不多", "Here today": "今天来过", "About": "岩馆信息", "Open today": "今天营业", "Day pass": "单次票", "From the gym’s listing.": "来自岩馆自己发布的信息。", "This gym hasn’t added its hours or prices yet.": "这家岩馆还没填营业时间和票价。", "Shoe rental": "租鞋", "Showers": "淋浴", "Training area": "训练区", "Kids’ wall": "儿童墙", "Café": "咖啡", "Yoga room": "瑜伽室", "Moon board": "Moon 板", "Sauna": "桑拿", "Climbed here": "在这里爬过", "no videos yet": "还没有视频", "When someone posts a climb from here, it shows up here.": "有人发布在这里的攀爬，会出现在这里。", "public": "公开", "climber": "位岩友", "climbers": "位岩友", "here today": "今天来过", "Your climbs here": "你在这里的攀爬", "visit": "次到访", "visits": "次到访", "route topped": "条完攀", "routes topped": "条完攀", "last climbed": "上次来", "I’m here": "我在这", "Usually, from check-ins over the last 4 weeks": "通常情况，来自过去 4 周的签到", "Grades here": "这里的难度", "Colour circuit: the hold colour is the grade range.": "颜色分级：岩点颜色就是难度区间。", "Tape and a grade tag": "胶带和难度牌", "Each route is marked by its tape colour; the grade is on the tag at the start hold.": "每条线路用胶带颜色标出，难度写在起步点的牌子上。", "We don’t know how this gym grades yet.": "我们还不知道这家岩馆怎么定难度。", "You here": "你在这里", "nothing yet": "还没有", "Routes you film, scan or log here show up here.": "你在这里拍、扫描或记录的线路会出现在这里。", "Photo a route. We read its tape and grade and draw the moves for your height.": "拍一条线路。我们读出胶带和难度，并按你的身高画出动作。", "Climbed one without a video? Add it by tape colour and grade.": "没拍视频？按胶带颜色和难度记下来。", "Holds you used, in colour": "你用过的岩点（彩色）", "Hand order": "手点顺序", "Your start": "你的起步", "Too few moves seen in this video to draw the climb.": "这段视频里看到的动作太少，画不出这次攀爬。", "Shows once this video is analysed: your moves, drawn on its wall.": "视频分析完后显示：你的动作，画在这面墙上。", "No one in the community has filmed this route yet, so here is your own climb, played again from this video. The wall is made from its frames with you taken off it, in grey; only the holds you used keep their colour, so the colour is your route. S is where you started and the numbers are the order your hands took the rest. The body moves the way the video saw you move, faster while you rest. Holds you didn’t touch stay grey: we can’t yet tell which holds belong to the route.": "社区里还没有人拍过这条线路，所以这里用这段视频把你自己的攀爬重放一遍。墙由视频画面拼成，去掉了你，并显示为灰色；只有你用过的岩点保留原来的颜色，有颜色的就是你的线路。S 是起步点，数字是你的手依次抓上其余岩点的顺序。身体按视频里你真实的动作移动，休息时快放。你没碰过的岩点保持灰色：我们还分不出哪些岩点属于这条线路。", "Where you got to": "你爬到的位置", "Move {} of {} · where you came off": "第 {0}/{1} 步 · 你在这里掉下来", "No one in the community has filmed this route yet, so this body is simulated at your height, {} cm. The holds are an example: we can’t map a wall yet.": "社区里还没有人拍过这条线路，所以这里按你的身高 {} 厘米模拟。岩点只是示例：我们还不能识别整面墙。", "Your videos": "你的视频", "Import a video or film a try. Each one gets analysed here.": "导入视频或拍一次尝试，每个视频都会在这里分析。",
  "Hips centred": "髋部在两脚中间", "Whole climb": "整段攀爬", "{}% centred": "{}% 在两脚中间", "Centred": "在中间", "Off to one side": "偏开", "Longest off {}–{}": "最长偏开 {0}–{1}",
  "See this stretch · {}": "看这一段 · {}", "See this rest · {}": "看这次休息 · {}", "See this move · {}": "看这个动作 · {}", "See this pause · {}": "看这次停顿 · {}", "See your best rest · {}": "看最好的一次休息 · {}",
  "Your straightest rest": "手臂最直的一次休息", "Your most bent rest": "手臂最弯的一次休息", "Arms at {}°": "手臂 {}°", "Your rests": "你的休息", "{}% on straight arms": "{}% 手臂伸直", "Straight": "伸直", "Bent": "弯曲", "Moving": "移动中",
  "Foot moved first": "脚先动", "Do this more": "多这样做", "Hand moved alone": "只动了手", "Try a foot first": "试试先动脚", "Hands and feet": "手和脚", "{} hand, {} foot": "手 {0} 次，脚 {1} 次", "Hands": "手", "Feet": "脚",
  "Your longest pause": "停得最久的一次", "{} s": "{} 秒", "Moving and pausing": "移动和停顿", "Longest pause {} s": "最长停顿 {} 秒", "Pause": "停顿", "Your best rest": "最好的一次休息",
  "{} with a hand, {} with a foot. Only the ones we’re sure of": "用手 {0} 次，用脚 {1} 次。只算我们有把握的",
  "We saw you here": "我们在这里看到了你", "In {}% of this video": "视频里 {}% 的时间能看到你", "Worth a look": "值得看看", "Still centred": "依然居中", "Add route": "添加线路", "Add it to see this try next to your others": "添加后可以和你的其他尝试放在一起看", "Tag {} V{}": "标记 {} V{}",
  "Watch again": "再看一次", "Close": "收起",
  "Sample video": "示例视频", "Tracking": "跟踪", "You and this route, confirmed": "你和这条路线已确认", "{} · move {}": "{0} · 第 {1} 步", "{} · move {} ›": "{0} · 第 {1} 步 ›",
  "While it plays": "播放时", "Tap play": "点击播放", "Following you": "正在跟踪你", "We follow your hands, feet, elbows and hips on every frame, on your phone.": "我们在手机上逐帧跟踪你的手、脚、手肘和髋部。",
  "Arms straight in {}% of your rests · longest rest {} s": "休息时 {0}% 手臂伸直 · 最长休息 {1} 秒",
  // ---- video detail: why you came off
  "Why you came off": "你为什么掉下来", "Not enough reach": "够不到", "Foot slipped": "脚滑了", "Different hold choice": "选点不同", "Likely": "很可能", "Possible": "有可能",
  "Your hand stopped 12 cm short of hold {}": "你的手离 {} 号点还差 12 厘米", "Your arm was fully straight at the top of the move": "伸到最高时手臂已完全伸直", "Both feet stayed on the low holds": "双脚都留在低处的点上",
  "Your right foot dropped 9 cm just before you came off move {}": "在第 {} 步脱落前，你的右脚下滑了 9 厘米", "Your hands came off after the foot moved": "脚先动，手才脱开", "Your hips were far from the wall": "你的髋部离墙较远",
  "You took a different hold on move {}": "第 {} 步你选了不同的点", "All 3 climbers your height who topped it went left": "身高相近的 3 位完攀者都走了左边", "After that the next hold was out of reach": "之后下一个点就够不到了",
  "Strength: not enough to say from one try. We only flag it when a pattern repeats.": "力量：只看一次尝试还无法判断。规律重复出现时才会提示。",
  "Your body on the wall": "你在墙上的身体", "Left hand": "左手", "Right hand": "右手", "Left foot": "左脚", "Right foot": "右脚", "On a hold": "在点上", "Moving": "移动中", "Off the wall": "离开岩壁",
  "Elbows": "手肘", "Knees": "膝盖", "Torso": "躯干", "Bent 8 s": "弯曲 8 秒", "Turned out": "外展", "Square to wall": "正对岩壁",
  "Your path and theirs": "你的路径和他们的", "Climbers your height who topped it": "身高相近的完攀者", "Your paths split after move {}.": "你们的路径在第 {} 步后分开。",
  "Can you reach it?": "你够得到吗？", "At {} cm with a {} cm arm span, move {} is in reach from the higher foot.": "身高 {0} 厘米、臂展 {1} 厘米时，踩高脚点就能够到第 {2} 步。",
  "A reach check for your size, not a full simulation. It can’t tell how hard the move feels.": "这是按你的身材做的可达性检查，不是完整模拟，判断不了动作有多费力。",
  "Across your routes": "跨路线来看", "Long reaches": "远距离伸手", "Foot slips": "脚滑", "Hold choice": "选点", "Your last {} falls.": "你最近 {} 次掉落。", "One drill": "一个练习",
  "Flag your free leg to reach further: 3 sets of 5 on an easy route.": "用空闲的腿做平衡来够得更远：在简单路线上做 3 组，每组 5 次。",
  "Silent feet: place each foot without a sound for one easy route.": "静音脚：爬一条简单路线，每次踩点都不出声。",
  "Read the route from the ground and point out each move before you start.": "出发前先在地面读线，把每一步指出来。",
  // ---- dock, tabs, common words
  "Today": "今天", "Walls": "岩墙", "Add": "添加", "Videos": "视频", "Friends": "好友", "Profile": "我的",
  "Back": "返回", "Done": "完成", "Save": "保存", "Change": "更改", "Continue": "继续", "Start": "开始", "End": "结束",
  "Delete": "删除", "Hide": "隐藏", "Keep": "保留", "Select": "选择", "Send": "发送", "Join": "加入", "Accept": "接受",
  "Decline": "拒绝", "Pick": "选择", "Tap": "轻点", "Enter": "确定", "Details": "详情", "Optional": "选填", "New": "新",
  "Added": "已添加", "Removed": "已移除", "Tagged": "已标记", "Sent": "已发送", "Topped": "已登顶", "Public": "公开",
  "Only you": "仅自己", "No one": "没有人", "You": "你", "Note": "备注", "Rest": "休息", "Grade": "难度", "Gym": "岩馆",
  "Level": "水平", "Height": "身高", "Arm span": "臂展", "Location": "位置", "Main": "主区", "Feed": "动态", "Crowd": "人流",
  "Quiet": "人少", "Busy": "人多", "Watch": "手表", "Film": "拍摄", "Upload": "上传", "Retake": "重拍", "Easier": "更简单",
  "Harder": "更难", "About right": "刚好", "Just now": "刚刚", "Yesterday": "昨天", "Hips": "髋部", "Analysed": "已分析",
  "Mondays": "每周一", "Thursdays": "每周四", "so far": "目前", "since Aug 17": "自 8 月 17 日起", "Not now": "以后再说",
  "Not yet": "还没有", "Notifications": "通知", "Your profile": "你的主页", "Disconnect": "断开连接",
  "Mon": "周一", "Tue": "周二", "Wed": "周三", "Thu": "周四", "Fri": "周五", "Sat": "周六", "Sun": "周日",
  "Yellow": "黄色", "Blue": "蓝色", "Red": "红色", "Green": "绿色", "Orange": "橙色", "Purple": "紫色", "Black": "黑色", "White": "白色",
  "Wall A": "A 墙", "Wall E": "E 墙", "Wall B": "B 墙", "Wall C": "C 墙", "Wall D": "D 墙",
  "Left hand": "左手", "Right hand": "右手", "Both hands": "双手", "Top: both hands": "终点：双手",
  "Saturday": "周六", "Sunday": "周日", "Monday": "周一", "Tuesday": "周二", "Wednesday": "周三", "Thursday": "周四", "Friday": "周五", "Tuesday, Nov 3": "11 月 3 日 周二",

  // ---- set up
  "Where do you climb?": "你在哪里攀岩？", "So we know where your climbs are. No account needed.": "这样我们知道你在哪攀岩。不用注册账号。",
  "Search gyms": "搜索岩馆", "Nearest first · from your location": "按距离排序 · 根据你的位置", "My gym isn’t listed": "列表里没有我的岩馆",
  "Add it in 30 seconds": "30 秒添加", "Add your gym": "添加你的岩馆", "Add gym": "添加岩馆", "Gym name": "岩馆名称",
  "e.g. Granite Room": "例如 Granite Room", "Street or town": "街道或城市", "Use my current location": "使用我当前的位置",
  "Current location": "当前位置", "Two fields, about 30 seconds. Climbers there can add routes later.": "两项内容，约 30 秒。那里的攀岩者之后可以添加线路。",
  "Type the gym’s name first": "先输入岩馆名称", "Add the gym’s name first": "先添加岩馆名称", "Add where it is too": "也写上它在哪里",
  "Can’t find it? Add your gym": "找不到？添加你的岩馆", "Add “{}” as a new gym": "把“{}”添加为新岩馆",
  "What do you climb now?": "你现在爬什么难度？", "Just starting": "刚开始", "First few times on the wall": "刚上墙几次",
  "Topping some": "能爬完一些", "You’ve topped a few easy routes": "你已经爬完过几条简单线路", "Getting there": "渐入佳境",
  "You top V2 most sessions": "你大多数时候能完攀 V2", "Helps us pick your next route.": "帮我们为你挑选下一条线路。",
  "Your size": "你的身材", "Level and size": "水平和身材",
  "Used to plan your moves on a scanned route and to find beta from climbers built like you.": "用于在扫描的线路上规划动作，并找到身材相近的攀岩者的 beta。",
  "Your sends are public": "你的完攀默认公开", "Hide any climb?": "要隐藏某次攀爬吗？",
  "Friends see what you top and can comment. Tap the button: any climb can be hidden, anytime.": "好友能看到你爬完的线路并评论。轻点按钮：任何一次攀爬随时都能隐藏。",
  "Public by default. Hide any climb from its video or the session summary.": "默认公开。可在视频或本次总结中隐藏任何一次攀爬。",
  "Tips and beta are pitched at this. Change it anytime.": "提示和 beta 会按这个水平给出。随时可以更改。",
  "V0 is the easiest, V10 the hardest. Most people start at V0–V2.": "V0 最简单，V10 最难。大多数人从 V0–V2 开始。",
  "Before you start": "开始之前", "Agreed, start here.": "好的，从这里开始。",
  "Alex filmed you climbing": "Alex 拍下了你攀岩", "Alex filmed 2 of your tries": "Alex 拍下了你的 2 次尝试", "Accept clips": "接受片段",
  "Alex tagged you in 2 clips. Accept and they go into your log. Decline and your name comes off Alex’s post.": "Alex 在 2 段片段中标记了你。接受后它们会进入你的记录；拒绝后你的名字会从 Alex 的帖子中移除。",
  "Yellow V3 · Wall B · Saturday. Accept and the clips land in your log.": "黄色 V3 · B 墙 · 周六。接受后片段会进入你的记录。",
  "Declined · your name is off Alex’s post": "已拒绝 · 你的名字已从 Alex 的帖子中移除",
  "Change your level, height and arm span here": "在这里更改你的水平、身高和臂展",
  "{} cm tall, {} cm arm span. {}": "身高 {} cm，臂展 {} cm。{}",
  "{} · {} cm · used to find beta from climbers built like you": "{} · {} cm · 用于寻找身材相近的攀岩者的 beta",
  "{} · {} cm · topped": "{} · {} cm · 已登顶", "{}–{} cm": "{}–{} cm",

  // ---- Today
  "Next goal: your first V{}": "下一个目标：你的第一条 V{}", "Next: {} at V{}": "下一步：{}，V{}", "Next: {}": "下一步：{}", "at V{}": "，V{}",
  "warm up": "热身", "drill": "专项练习", "project": "项目", "cool down": "放松",
  "Plan done · climb anything": "计划完成 · 随便爬吧", "Saved · {} today": "已保存 · 今天 {}",
  "No tries at V{} yet. The plan below gets you there.": "还没尝试过 V{}。按下面的计划练就能到。",
  "Move {} of {}": "第 {}/{} 步", "is your closest, in {}": "最接近 · 共 {}",
  "Focus": "重点", "Turn your hip in on long reaches": "远距离伸手时把髋转向墙", "Straight arms, push with your legs": "手臂伸直，用腿蹬",
  "Today’s plan, {} min{}": "今天的计划，{} 分钟{}", ", all done": "，全部完成",
  "Warm up": "热身", "Drill": "专项练习", "Project": "攻坚", "Cool down": "放松",
  "{}, {} min, {} of {} done": "{}，{} 分钟，完成 {}/{}",
  "Easy and quiet": "轻松、安静", "Drop knee": "压膝", "Straight arms": "直臂", "Stretch and push": "拉伸和俯卧撑",
  "One V{}, {} tries": "一条 V{}，{} 次", "Easy V{}": "简单 V{}", "Route {}": "线路 {}", "Try {}": "第 {} 次",
  "Mobility · 2 min": "关节活动 · 2 分钟", "Forearms · 30 s a side": "前臂 · 每侧 30 秒", "10 push-ups": "10 个俯卧撑",
  "{} min": "{} 分钟", "{} min{}": "{} 分钟{}",
  "Loosen wrists, shoulders and hips, then two easy routes with silent feet.": "活动手腕、肩膀和髋部，然后爬两条简单线路，落脚不出声。",
  "Before each long reach, turn that hip to the wall and drop the knee.": "每次远距离伸手前，把那侧髋转向墙并压膝。",
  "Hang on straight arms, move your feet first, stand up with your legs.": "直臂挂住，先移动脚，再用腿站起来。",
  "Stretch your forearms, then push-ups to balance the pulling.": "拉伸前臂，再做俯卧撑，平衡拉的动作。",
  "Any colour. Rest 2 min between.": "任何颜色都行。每条之间休息 2 分钟。",
  "Rest 3 min between. Stop if your fingers open.": "每次之间休息 3 分钟。手指抓不住就停。",
  "Film each one: {}.": "每次都拍下来：{}。", "we check your hip on the long reach": "我们会检查你远距离伸手时的髋部",
  "we check your arms on each move": "我们会检查你每一步的手臂",
  "From {} tries at V{}: you stop on long reaches, hips square to the wall.": "来自你在 V{1} 的 {0} 次尝试：你在远距离伸手时停下，髋部正对墙。",
  "From your {}: your arms bend between moves.": "来自你的 {}：你在动作之间手臂弯曲。",
  "Where most climbers at {} start. Film a try to make it yours.": "{} 水平的大多数攀岩者从这里开始。拍一次尝试，让它更适合你。",
  "Film try {}": "拍第 {} 次", "Film a route": "拍一条线路", "a route": "一条线路",
  "Playing the {} demo · 0:20": "正在播放{}示范 · 0:20", "warm-up": "热身", "cool-down": "放松", "drop knee": "压膝", "straight arms": "直臂",
  "Sends by grade": "各难度完攀", "Sends per grade": "各难度完攀", "Sends per grade, {} in all. Opens your progress": "各难度完攀，共 {} 次。打开你的进度",
  "2 here": "2 人在", "Alex is on Wall B": "Alex 在 B 墙", "till 6 PM": "到下午 6 点", "till 4 PM": "到下午 4 点", "till noon": "到中午",
  "Invite the people you climb with. You’ll see each other’s climbs.": "邀请一起攀岩的人。你们能看到彼此的攀爬。",
  "Invite the people you climb with": "邀请一起攀岩的人",
  "{} · usual crowd by hour, from check-ins over 4 weeks": "{} · 每小时的常见人流，来自 4 周的签到",
  "{} · ready when you are": "{} · 随时可以开始", "Climbing at {}, {}. Open the session": "正在 {} 攀岩，{}。打开本次攀岩", "Film or log a climb with Add. It shows up here when you end the session.": "用“添加”拍摄或记录一次攀爬。结束本次后会显示在这里。", "It stays first in Gym until you top it": "登顶前它会排在岩馆页的最前面",
  "Tap Film before each try": "每次尝试前轻点拍摄", "Tap your watch before each try": "每次尝试前轻点手表",
  "{} · {} this session": "{} · 本次 {}",
  "{}× longer on move {} than people who topped it": "第 {1} 步比登顶的人多用 {0} 倍时间",
  "Topped · see how others climbed it": "已登顶 · 看看别人怎么爬", "We compare each move with people who topped it": "我们会把每一步和登顶的人比较",
  "topped": "已登顶", "move {} of {}": "第 {}/{} 步", "Plan the next session": "规划下一次",

  // ---- walls, scan, route
  "no routes yet": "还没有线路", "Your level {}": "你的级别 {}", "Look for {} or {} on the tag by the start hold.": "在起步点旁的难度牌上找 {} 或 {}。",
  "Tap one to see how climbers your height did it.": "轻点一条，看和你差不多高的人怎么爬。", "How climbers your height did it": "和你差不多高的人怎么爬",
  "{} {}: how to climb it and your tries": "{} {}：怎么爬和你的尝试", "moves climbed": "爬到的步数", "you got to move {} of {}": "你爬到第 {} 步，共 {} 步",
  "+ Try again": "+ 想再试", "Trying again": "想再试", "Saved to try again": "已加入想再试", "Save to try again": "加入想再试",
  "{} {} saved to try again": "{} {} 已加入想再试", "{} {} no longer saved": "{} {} 已移出想再试",
  "Move 5 is a stretch for you, so we add a high foot before it.": "第 5 步对你来说有点远，所以我们在它前面加了一个高脚点。",
  "Tips are pitched at this. Change it anytime.": "提示会按这个水平给出。随时可以更改。",
  "Used to plan your moves on a scanned route and to show you climbers built like you.": "用于在扫描的线路上规划动作，并给你看身材相近的攀岩者。",
  "{} · {} cm · used to show you climbers built like you": "{} · {} cm · 用于给你看身材相近的攀岩者",
  "Your first route": "你的第一条线路", "Every route in the gym works like this one.": "岩馆里每条线路都是这样爬的。",
  "A wall in the gym with one route marked: its holds, its start, its grade tag and its top": "岩馆里的一面墙，标出了一条线路：它的岩点、起点、难度牌和顶点",
  "Top": "顶点", "Touch it with both hands. Then climb down, or drop onto the mat with bent knees.": "两只手都摸到它就算爬完。然后爬下来，或者屈膝跳到垫子上。",
  "One colour, one route": "一种颜色，一条线路", "Use only the holds in its colour.": "只用这个颜色的岩点。",
  "Start hold": "起点", "Both hands on the hold with the tape under it.": "两只手放在下面贴着胶带的岩点上。",
  "Grade tag": "难度牌", "{} is your level.": "{} 是你的级别。",
  "Scan the wall in front of you": "扫描你面前的这面墙", "We mark the same four things on your route, plus each move for your height.": "我们会在你的线路上标出同样这四样，再按你的身高画出每一步。",
  "no routes here yet": "这里还没有线路", "{} you’ve climbed or scanned here": "你在这里爬过或扫描过的 {}",
  "New to {}": "第一次来 {}", "Every route at {} works like this one.": "{} 的每条线路都是这样爬的。",
  "Colour is the grade": "颜色就是难度", "{} is {}, your level.": "{0}是 {1}，你的级别。",
  "Change gym": "切换岩馆", "{} away": "距离 {}", "You’re climbing here": "你正在这里攀岩", "Your routes here": "你在这里的线路", "your level {}": "你的级别 {}",
  "You’re here": "你在这里", "You’re at {}": "你在 {}", "this session moves here": "本次攀岩改到这里", "Climbed at {}": "在 {} 爬过", "None yet": "还没有",
  "find gyms near you": "查找附近的岩馆",
  "You’ve climbed at {}": "你在 {} 爬过", "Pick the gym you’re at": "选你所在的岩馆", "Where you climb": "你去过的岩馆",
  "your routes and videos": "你的线路和视频", "More near you": "附近的其他岩馆", "Near you": "附近", "No other gyms in this distance.": "这个距离内没有其他岩馆。",
  "last climbed {}": "上次 {}",
  "Live analysis": "实时分析", "Tap play to analyse": "点播放开始分析", "Analysing live": "正在实时分析", "Loading the pose model…": "正在加载姿态模型…", "Paused": "已暂停",
  "Try finished": "这次尝试结束", "The pose model needs a connection": "姿态模型需要联网加载",
  "Moving now": "正在动", "Arms": "手臂", "Hips": "髋部", "Moves so far": "已完成动作", "Straight-arm rests": "直臂休息", "Longest rest": "最长休息",
  "While the video plays, we find your hands, feet, elbows and hips on every frame, on your phone.": "视频播放时，我们在手机上逐帧找出你的手、脚、手肘和髋部。",
  "Left hand": "左手", "Right hand": "右手", "Left foot": "左脚", "Right foot": "右脚", "Still": "静止", "Straight": "伸直", "Bent": "弯曲",
  "Over your feet": "在脚的正上方", "Out to the left": "偏左", "Out to the right": "偏右",
  "Can’t see the whole climber. Film from further back, phone on the floor.": "看不到完整的身体。手机放在地上，离远一点拍。",
  "Feet first: good. Stand up on it before the next reach.": "先动脚，很好。站稳了再伸手。",
  "Reaching. Push with your legs as the hand goes.": "正在伸手。出手的同时用腿蹬。",
  "Resting on bent arms tires you fast. Let your arms go straight and hang.": "弯着手臂休息很快会累。把手臂伸直，挂在上面。",
  "Hips away from your feet here. Planned, or stuck?": "这里髋部离脚较远。是有计划的，还是卡住了？",
  "Good rest: arms straight, hips over your feet.": "休息得好：手臂伸直，髋部在脚的正上方。",
  "arms straight in {} of your rests": "{} 的休息时间手臂是直的", "longest rest {} s": "最长休息 {} 秒",
  "Your routes": "你的线路", "{} you’ve climbed or scanned": "你爬过或扫描过的 {}", "routes show up here once you scan or climb them": "扫描或爬过的线路会出现在这里",
  "Scan a wall": "扫描岩墙", "Found a new route?": "发现新线路？", "Find a route": "找一条线路",
  "Take a photo of it. We read its tape colour and grade, and draw the moves on it for your height.": "拍一张照片。我们读取它的胶带颜色和难度，并按你的身高在上面画出动作。",
  "We read the tape colour and grade from a photo": "我们从照片读取胶带颜色和难度", "Take the photo": "拍照",
  "Fit one route in the frame, from the start hold to the top. Include its tag if you can see it.": "把一条线路放进画面，从起步点到终点。看得到标签的话也拍进去。",
  "Wall C through the camera": "相机中的 C 墙", "Wall C, the purple route with its moves drawn on": "C 墙，画好动作的紫色线路",
  "Read from the photo · Purple tape, V2": "从照片读取 · 紫色胶带，V2", "Purple {} read from the tag · {} moves": "从标签读取紫色 {} · {} 步",
  "{}Purple {} · {} moves": "{}紫色 {} · {} 步", "Its moves, for your height": "它的动作，按你的身高",
  "We read the tape colour and the grade on the gym’s tag, then draw the moves on your photo, planned for {} cm.": "我们读取胶带颜色和岩馆标签上的难度，然后按 {} cm 在你的照片上画出动作。",
  "Step {} of {}": "第 {}/{} 步", "Previous move": "上一步", "Next move": "下一步", "Previous frame": "上一帧", "Next frame": "下一帧",
  "Both hands on the big pinch, feet on the two low chips. Sit back, arms straight.": "双手握住大捏点，脚踩两个低处的脚点。身体后坐，手臂伸直。",
  "Left hand to the pinch": "左手到捏点", "Right hand to the sloper": "右手到圆点", "Left hand to the crimp": "左手到抠点", "Right hand to the jug": "右手到大把手",
  "Step your left foot up first, then reach. Stand up through your legs.": "先把左脚抬上去，再伸手。用腿站起来。",
  "Turn your left hip into the wall. The crimp comes to you; don’t pull with bent arms.": "把左髋转向墙。抠点自然就够到了；别弯着手臂拉。",
  "Right foot onto the chip by your knee, then the jug is a short reach.": "右脚踩到膝盖旁的脚点，大把手就很近了。",
  "Match the top hold and hold it for 3 seconds. Climb down, or drop with bent knees.": "双手抓住终点并保持 3 秒。爬下来，或屈膝落地。",
  "The longest reach, {} cm. At {} cm arm span, high-step your right foot onto the chip first, then go.": "最远的一步 {} cm。你的臂展是 {} cm，先把右脚高抬到脚点上再出手。",
  "The longest reach, {} cm. Your {} cm arm span gets there from the jug: keep your arm straight.": "最远的一步 {} cm。你 {} cm 的臂展从大把手就能够到：保持手臂伸直。",
  "Move 5 is a stretch for you, so the beta adds a high foot before it.": "第 5 步对你来说有点远，所以 beta 在它前面加了一个高脚点。",
  "Every move is in reach without extra feet.": "不用额外脚点，每一步都够得到。",
  "Open this route": "打开这条线路", "Log it": "记录", "Watch climbers your height on it": "看和你一样高的人怎么爬",
  "Tag and analyse": "标记并分析", "Tag {} V{} and analyse": "标记 {} V{} 并分析", "Tag it": "标记", "{}Tag {}": "{}标记{}",
  "No tape colour in frame. Pick its colour and the grade on its tag.": "画面里没有胶带颜色。选择它的颜色和标签上的难度。",
  "No tape colour in frame. Tag the colour and grade and we analyse the moves.": "画面里没有胶带颜色。标记颜色和难度，我们来分析动作。",
  "Beta from your height": "身高相近的 beta", "Tap one for beta from climbers your height.": "轻点一条，查看和你一样高的人的 beta。",
  "{} your height topped it": "{} 位和你一样高的人登顶了", "{} your height topped it. Tap to watch.": "{} 位和你一样高的人登顶了。轻点观看。",
  "{} climbers your height topped it": "{} 位和你一样高的人登顶了", "{} climbers your height topped it. Tap to watch.": "{} 位和你一样高的人登顶了。轻点观看。",
  "{} climber your height topped it": "{} 位和你一样高的人登顶了", "{} climber your height topped it. Tap to watch.": "{} 位和你一样高的人登顶了。轻点观看。",
  "Add to projects": "加入项目", "In your projects": "在你的项目里", "It shows up first on Today until you top it": "登顶前它会排在今天的最前面",
  "{} {} added to projects": "{} {} 已加入项目", "{} {} removed from projects": "{} {} 已从项目移除", "+ Project": "+ 项目",
  "How to climb it": "怎么爬", "Your tries": "你的尝试", "Your tries on {}": "你在 {} 上的尝试", "Highest move": "最高一步",
  "Highest move on each try": "每次尝试的最高一步", "Highest move on each of your {} tries · the top is move {}": "你 {} 次尝试各自的最高一步 · 终点是第 {} 步",
  "Highest move {} of {}": "最高第 {}/{} 步", "highest move": "最高一步", "your highest move": "你的最高一步", "Moves; you reached move {}": "动作；你到了第 {} 步",
  "moves, read from your photo": "步，从你的照片读取", "moves, from your photo": "步，来自你的照片", "start to top": "从起步到终点",
  "You reached move {} of {}": "你到了第 {}/{} 步", "Older routes": "以前的线路", "Your next route · tap it to change": "你的下一条线路 · 轻点更改",
  "{} {}: beta and tries": "{} {}：beta 和尝试", "{} · {} moves{}": "{} · {} 步{}",
  "Big holds all the way. Good first one if you’re new.": "全程大点。新手的第一条首选。",
  "Big holds all the way. Keep your arms straight.": "全程大点。保持手臂伸直。",
  "Big pinches low, small crimps near the top. Turn your left hip in on move 4 and save your arms for the last reach.": "下面是大捏点，靠近顶部是小抠点。第 4 步把左髋转进去，把手臂的力气留给最后一下。",
  "Move 4 is a long reach to a sloper. Turn your hip in before you go.": "第 4 步要远距离够一个圆点。出手前把髋转进去。",
  "Short and steep. Push with your legs, not your arms.": "短而陡。用腿蹬，不要用手臂拉。",
  "Small feet on the slab. Stand up slowly on move 3.": "斜板上脚点很小。第 3 步慢慢站起来。",
  "Steep start. Keep your feet on through moves 2 and 3.": "起步很陡。第 2、3 步脚不要掉。",
  "Trust your feet. Keep your hips close to the wall.": "相信你的脚。髋部贴近墙。",
  "Read it from the ground first: find the start holds and the last one.": "先在地面读线：找到起步点和终点。",
  "Turn your hip into the wall before the long reach, so your arms stay straight.": "远距离伸手前把髋转向墙，这样手臂能保持伸直。",
  "Turn your hip into the wall before you reach for move {}. {} does it, then the hold comes to them.": "够第 {} 步之前把髋转向墙。{} 就是这么做的，然后岩点就到手了。",

  // ---- add a climb, camera, logging
  "Add a climb": "添加一次攀爬", "climbing for {}": "已攀岩 {}", "today": "今天", "Log by hand": "手动记录", "Log a climb": "记录一次攀爬",
  "Climbed one without a video?": "爬了但没拍视频？", "Log it by its tape colour and grade.": "按胶带颜色和难度记录。",
  "{} climbing videos found in Photos": "在相册里找到 {} 个攀岩视频", "{} {}climbing videos in Photos": "相册里有 {} 个{}攀岩视频",
  "Videos from Photos": "相册里的视频", "Import {}": "导入 {}", "{} videos imported · each trimmed to the climb": "已导入 {} 个视频 · 每个都剪到攀爬部分",
  "Which route are you on?": "你在爬哪条线路？", "None of these · tag it later": "都不是 · 之后再标记", "No route · tag it later": "没有线路 · 之后再标记",
  "Tag it later in Videos": "之后在视频里标记", "Reading the tape…": "正在读取胶带…", "Point the camera at the route": "把相机对准线路",
  "Read from the tape in frame": "从画面里的胶带读取", "The route you picked": "你选的线路", "Camera view of the wall": "岩墙的相机画面",
  "Prop the phone up so the whole route fits, then tap once. Climb as many tries as you like.": "把手机立好，让整条线路都在画面里，然后轻点一次。想爬几次都行。",
  "Recording. We cut out each try when you leave the ground and land.": "录制中。你离地和落地时，我们会自动切出每一次尝试。",
  "{} cut so far. Keep going, or tap stop when you’re done.": "已切出 {}。继续爬，或者爬完轻点停止。",
  "Start recording": "开始录制", "Stop recording": "停止录制", "REC {}:{}": "录制 {}:{}", "Try {} · 0:{}": "第 {} 次 · 0:{}",
  "Your last video": "你的上一个视频", "{}Use a watch": "{}使用手表", "{}Watch ready": "{}手表已就绪",
  "Try {} saved": "第 {} 次已保存", "Tries {}–{} saved": "第 {}–{} 次已保存", "Sent on try {}": "第 {} 次完攀",
  "{} · tap a try to watch it": "{} · 轻点一次尝试观看", "{} · public, hide it in Videos": "{} · 公开，可在视频里隐藏",
  "What to change": "要改什么", "{}I topped it": "{}我登顶了", "Add a note": "加一条备注", "Note saved{}": "备注已保存{}",
  "{} sent": "{} 完攀", "Your first send! {}": "你的第一次完攀！{}", "Your first send!": "你的第一次完攀！",
  "Sent it?": "完攀了吗？", "Log the send": "记录完攀", "How did it feel?": "感觉怎么样？", "How did it feel for a {}?": "作为{}感觉怎么样？",
  "How it went": "过程如何", "What worked? e.g. left heel hook on move 3": "什么管用？例如第 3 步左脚挂脚跟", "Who filmed you?": "谁拍的你？",
  "Send a link": "发送链接", "· link ready to send": "· 链接已准备好", "· clip sent to {}": "· 片段已发给 {}",
  "{}{} {} logged{}": "{}{} {} 已记录{}", "{} {} logged at {}": "{} {} 已在 {} 记录", "Keep climbing?": "继续爬吗？",
  "Try again now?": "现在再试一次？", "{}Try again": "{}再试一次", "End session": "结束本次", "Rest a minute, then start filming": "休息一分钟，然后开始拍摄",
  "Rest a minute, then tap your watch as you start": "休息一分钟，开始时轻点手表", "{} so far · {} · {}": "目前 {} · {} · {}",
  "Filming {}": "正在拍摄 {}", "Filming without a route · tag it later in Videos": "无线路拍摄 · 之后在视频里标记",
  "{} saved · tag the route in Videos": "{}已保存 · 在视频里标记线路", "Pick the route, then how it went": "选择线路，再写过程",
  "Pick a route": "选择线路", "Pick the tape colour": "选择胶带颜色", "Pick the grade": "选择难度", "Tape colour": "胶带颜色",
  "Tape colour and grade": "胶带颜色和难度", "Or pick tape colour and grade": "或者选择胶带颜色和难度", "Pick a colour and a grade": "选择颜色和难度",
  "Snap the route’s tag": "拍线路的标签", "The grade on the gym’s tag. No tag? Pick what it felt like.": "岩馆标签上的难度。没有标签？选你感觉的难度。",
  "Which gym?": "哪个岩馆？", "Which route is this?": "这是哪条线路？", "{} you picked": "你选的 {}", "Video from {} · {}": "{}的视频 · {}",
  "Video from {}, {}{}": "{}的视频，{}{}", "No location in the video · pick the gym": "视频里没有位置 · 选择岩馆", "Unknown gym": "未知岩馆",
  "Gym · from where it was filmed": "岩馆 · 根据拍摄地点", "Gym · picked by you": "岩馆 · 你选的", "picked by you": "你选的",
  "from your location": "根据你的位置", "read from the gym’s tag · {}": "从岩馆标签读取 · {}", "read from the tape colour in frame": "从画面里的胶带颜色读取",
  "read from the tape on the holds": "从岩点上的胶带读取", "Route · {}": "线路 · {}", "No route": "没有线路", "No route yet": "还没有线路",
  "No route {}": "没有线路 {}", "Logged by hand": "手动记录", "{} by hand": "手动 {}", "No video needed": "不需要视频",
  "{} {} saved for next time": "{} {} 已留到下次", "the first one": "第一条", "the route you were on": "你刚才爬的线路",
  "you came off reaching for {}": "你在够第 {} 步时掉了下来",

  // ---- watch
  "Climb with your watch": "戴着手表攀岩", "Apple Watch or Wear OS": "Apple Watch 或 Wear OS", "{}Connect a watch": "{}连接手表",
  "Chalky hands, phone on the floor: log each try from your wrist while the phone films.": "手上有镁粉、手机放地上：手机拍摄时，用手腕记录每次尝试。",
  "Your watch marks each try": "手表会标记每次尝试", "Tap as you start. The phone starts filming.": "开始时轻点。手机开始拍摄。",
  "Tap when you’re down, then answer.": "落地时轻点，然后回答。", "Buzzes when it’s time to go again.": "该再爬时会振动提醒。",
  "On your wrist": "在你的手腕上", "Maria’s Apple Watch": "Maria 的 Apple Watch", "Connected · counts tries and session time": "已连接 · 计算尝试次数和时长",
  "Not connected": "未连接", "Not connected yet": "还没连接", "Watch connected · tap it before each try": "手表已连接 · 每次尝试前轻点",
  "Watch disconnected": "手表已断开", "No signal?": "没信号？", "Tries save on the watch and sync when your phone is back.": "尝试会存在手表上，手机恢复连接后同步。",
  "Session time": "时长", "From your first tap to End, rest included.": "从第一次轻点到结束，包括休息。",

  // ---- compare
  "Compare your last try": "比较你的上一次尝试", "Compare with someone your height": "和身高相近的人比较",
  "Side by side with someone your height who topped it": "和登顶的、身高相近的人并排对比", "Side by side, move by move": "并排对比，一步一步",
  "You and {}, move by move": "你和 {}，一步一步", "What we saw": "我们看到的", "One tip": "一条提示", "One drill for next time": "下次的一个练习",
  "Hip-turn reaches: 3 sets of 5 on any V0, before your first try.": "转髋伸手：在任意 V0 上做 3 组、每组 5 次，在第一次尝试前完成。",
  "Time on it": "停留时间", "people who topped it: {} s": "登顶的人：{} 秒", "{} · you took {} s": "{} · 你用了 {} 秒",
  "closer to the wall than yours": "比你的更贴近墙", "What {} does on move {}": "{} 在第 {} 步怎么做", "Your try": "你的尝试",
  "Whole climb": "整次攀爬", "every move in this try": "这次尝试的每一步", "Move {} · frame {} of 210": "第 {} 步 · 第 {}/210 帧",
  "From move {} to move {} in {}.": "从第 {} 步到第 {} 步，用了 {}。", "Your clip and the tip stay on {} {}.": "你的片段和提示保存在 {} {} 上。",
  "Move {}": "第 {} 步", "Move {}/{}": "第 {}/{} 步", "move {}/{}": "第 {}/{} 步", "You · try {}": "你 · 第 {} 次",
  "One try less": "少一次尝试", "One try more": "多一次尝试", "{}’s send": "{} 的完攀",

  // ---- summary, profile
  "Session saved": "本次已保存", "Session posted": "本次已发布", "Post and see your progress": "发布并查看进度", "See your progress": "查看进度",
  "Sends post to your profile and friends’ feed, where friends can comment. Hidden climbs and their videos stay private. Tap a climb to watch it.": "完攀会发布到你的主页和好友动态，好友可以评论。隐藏的攀爬和视频保持私密。轻点一次攀爬观看。",
  "Hidden from your profile and friends’ feed": "已从你的主页和好友动态中隐藏", "hidden · only you see them": "已隐藏 · 只有你能看到",
  "public again": "已重新公开", "public climbs": "公开的攀爬", "· {} hidden": "· {} 已隐藏", "{} posted{}": "{}已发布{}",
  "to Alex and Jo’s feed": "到 Alex 和 Jo 的动态", "to the {} feed": "到 {} 动态", "{} · {} · sends public": "{} · {} · 完攀公开",
  "No tries recorded": "没有记录尝试", "We’ll ask again after your next session": "下次攀岩后我们会再问",
  "Your progress": "你的进度", "Days you climbed": "攀岩的日子", "{} sessions in 12 weeks": "12 周内 {} 次", "1 session · {} · {} on the wall": "1 次 · {} · 在墙上 {}",
  "November so far": "11 月至今", "October recap": "10 月回顾", "hardest V{}": "最难 V{}", "sends · hardest {}": "次完攀 · 最难 {}",
  "this week · hardest {}": "本周 · 最难 {}", "{} · hardest V2, {} at V3 so far": "{} · 最难 V2，目前在 V3 有 {}",
  "sends yet · your first one shows here": "次完攀 · 你的第一次会显示在这里", "9 sends": "9 次完攀", "{} since Aug 17": "自 8 月 17 日起 {}",
  "Export your log": "导出你的记录", "CSV with every try, send and video link": "包含每次尝试、完攀和视频链接的 CSV",
  "spotter-log.csv · 142 tries, 24 sends, every video link": "spotter-log.csv · 142 次尝试，24 次完攀，所有视频链接", "spotter-log.csv · {} so far": "spotter-log.csv · 目前 {}",
  "Who sees your climbs": "谁能看到你的攀爬", "Who sees it": "谁能看到", "On your profile · friends can comment": "在你的主页 · 好友可以评论",
  "Pick who filmed you when you log a send": "记录完攀时选择谁拍了你", "Guide · grades, tape colours, gym etiquette": "指南 · 难度、胶带颜色、岩馆礼仪",
  "No sessions yet": "还没有攀岩记录", "Start one from Today. It shows up here when you end it.": "从今天开始一次。结束后会显示在这里。",
  "No new notifications": "没有新通知",

  // ---- videos, one video
  "Your videos": "你的视频", "Your tries on video, each one analysed": "你的尝试视频，每个都已分析", "No videos yet": "还没有视频",
  "Film a try at the gym or upload one from your camera roll. Each video shows how high you got and where you stall.": "在岩馆拍一次尝试，或从相册上传。每个视频都会显示你爬到多高、卡在哪里。",
  "{}Film a try": "{}拍一次尝试", "None yet · film or upload a try": "还没有 · 拍摄或上传一次尝试", "Upload videos": "上传视频",
  "Camera roll · climbing videos first · pick one or many": "相册 · 攀岩视频优先 · 选一个或多个", "Hide videos already added": "隐藏已添加的视频",
  "Show {} already added": "显示已添加的 {}", ", already added": "，已添加", ", trimmed from {}": "，从 {} 剪出",
  "Only the videos you pick leave your phone. You can keep climbing while we read them.": "只有你选的视频会离开手机。我们读取时你可以继续爬。",
  "Pick a video": "选一个视频", "Reading {}": "正在读取 {}", "Sorted, trimmed and matched to their routes": "已整理、剪辑并匹配到线路",
  "Trimming each one to the climb and matching it to the route on the same holds. You can keep climbing.": "正在把每个剪到攀爬部分，并匹配到同一组岩点的线路。你可以继续爬。",
  "Filmed Oct 12 – Nov 1. We sort them by gym, date and tape colour, trim each one to the climb and log it as a try.": "拍摄于 10 月 12 日至 11 月 1 日。我们按岩馆、日期和胶带颜色整理，剪到攀爬部分并记为一次尝试。",
  "Filmed Sun, Nov 1. We read the gym, date and tape colour, match each one to its route and trim it to the climb.": "拍摄于 11 月 1 日 周日。我们读取岩馆、日期和胶带颜色，匹配到线路并剪到攀爬部分。",
  "18 videos sorted · 3 need a route": "18 个视频已整理 · 3 个需要线路", "· all analysed": "· 全部已分析", "· each one matched to its route": "· 每个都已匹配线路",
  "· {} need{} a route": "· {} 需要线路", "· {} without a route": "· {} 没有线路", "video needs": "个视频需要", "videos need": "个视频需要",
  "· no location in the video": "· 视频里没有位置", "{} videos tagged": "{} 个视频已标记", "{} added": "已添加 {}", "{} added{}": "已添加 {}{}",
  "2 clips added to Orange V2": "2 段片段已添加到橙色 V2", "2 clips added to Yellow V3 · in Videos": "2 段片段已添加到黄色 V3 · 在视频里",
  "Tap videos to select them": "轻点视频进行选择", "Tap to select": "轻点选择", "{} selected": "已选 {}", "All {}": "全部 {}",
  "Change route": "更改线路", "Delete video": "删除视频", "Delete {}?": "删除 {}？", "Delete {} from Photos?": "从相册删除 {}？",
  "The tries stay in your log, with how high you got.": "尝试会保留在记录里，包括你爬到多高。", "The try stays in your log": "这次尝试会保留在记录里",
  "Video deleted · the try stays in your log": "视频已删除 · 尝试保留在记录里", "{} deleted · the tries stay in your log": "{}已删除 · 尝试保留在记录里",
  "Free up space on your phone": "释放手机空间", "Delete originals": "删除原视频", "Keep them": "保留",
  "{} still in Photos · {} GB. Spotter keeps the trimmed copies.": "{} 仍在相册 · {} GB。Spotter 会保留剪好的副本。",
  "Spotter keeps a trimmed copy of each, with its analysis. Frees {} GB.": "Spotter 会保留每个的剪辑副本和分析。可释放 {} GB。",
  "{} GB freed on your phone": "已释放手机 {} GB", "Highlight reel": "精彩集锦", "Your highlight reel": "你的精彩集锦",
  "in one video, labelled with grade and gym": "合成一个视频，标注难度和岩馆", "{} · {} seconds · labels added for you": "{} · {} 秒 · 已为你加好标注",
  "Each send plays for 8 seconds, from its last move to the top.": "每次完攀播放 8 秒，从最后一步到登顶。",
  "Save to Photos": "保存到相册", "Saved to Photos": "已保存到相册", "Share this send": "分享这次完攀", "Share your send": "分享你的完攀",
  "Grade, tape colour and gym added from the video": "难度、胶带颜色和岩馆已从视频添加", "A poster with the grade, tape colour and gym on it": "一张带难度、胶带颜色和岩馆的海报",
  "Copy link": "复制链接", "Link copied · paste it anywhere": "链接已复制 · 可粘贴到任何地方", "Play the video": "播放视频", "Playing · {}": "正在播放 · {}",
  "This video": "这个视频", "Video without a route": "没有线路的视频", "Not tagged yet": "还没标记", "Tagged {} · try {} · analysis ready": "已标记{} · 第 {} 次 · 分析已完成",
  "{} {} · analysis ready": "{} {} · 分析已完成", "{}Open the analysis": "{}打开分析", "Latest · {}, try {}": "最新 · {}，第 {} 次",
  "Film your next try and it lands here, next to this one.": "拍下一次尝试，它会出现在这里，紧挨着这一个。",
  "Next time, tap Film on the route card before each try and they show up here.": "下次每次尝试前在线路卡上轻点拍摄，它们就会出现在这里。",
  "{} on the same holds, matched for you.": "同一组岩点上的 {}，已为你匹配。", "{} of your tries · newest first": "你尝试的 {} · 最新的在前",
  "Filmed at {}": "拍摄于 {}", "Filmed by friends": "好友拍摄", "· filmed by {}": "· 由 {} 拍摄", "filmed by {}": "由 {} 拍摄", "{} without a route": "{} 个没有线路", "new": "新", "move {}": "第 {} 步", "by {}": "由 {}",
  "Added by you": "你添加的", "Topped in {} on video.": "视频中用 {} 登顶。", "Topped · all {} moves": "已登顶 · 全部 {} 步",
  "highest move and time on each move": "最高一步和每一步的用时", "We cut out each try": "我们切出每次尝试",
  "Third try. Heel hook on move 3 did it.": "第三次。第 3 步挂脚跟搞定了。", "That heel hook!": "那个挂脚跟！",
  "Purple V2 · 3 videos, last climbed Oct 12": "紫色 V2 · 3 个视频，上次攀爬 10 月 12 日", "Purple V2 · last climbed Oct 12 · 3 videos kept": "紫色 V2 · 上次攀爬 10 月 12 日 · 保留 3 个视频",
  "Purple {} is filled in. Add how it went.": "紫色 {} 已填好。写下过程。", "Wall A · Boneyard Boulders · Saturday · 2 tries": "A 墙 · Boneyard Boulders · 周六 · 2 次尝试",
  "Wall A · {} · just now": "A 墙 · {} · 刚刚", "· topped": "· 已登顶", "· try {}": "· 第 {} 次", "on try {}": "第 {} 次", "on try {} · {} · {}": "第 {} 次 · {} · {}",
  "tries {} to {}": "第 {} 到 {} 次", "tries {}–{}": "第 {}–{} 次", "try {}": "第 {} 次", "{} · try {}": "{} · 第 {} 次", "{} {} · try {}": "{} {} · 第 {} 次",
  "{} {} · {} · try {}": "{} {} · {} · 第 {} 次", "{}{} {} · try {}": "{}{} {} · 第 {} 次", "{}{} · try {}": "{}{} · 第 {} 次", "Try {}, {}": "第 {} 次，{}",
  "{} {}: open the video": "{} {}：打开视频", "{} · topped on try {}": "{} · 第 {} 次登顶", "Today, 5:58 PM": "今天 下午 5:58", "Today, 6:12 PM": "今天 下午 6:12",
  "Mon, Oct 12": "10 月 12 日 周一", "Sun, Nov 1": "11 月 1 日 周日", "Sun, Oct 25": "10 月 25 日 周日", "1 h ago": "1 小时前", "2 h ago": "2 小时前",

  // ---- friends
  "Plan with friends": "和好友约", "Who’s free": "谁有空", "Alex and Jo are both free Thursday evening.": "Alex 和 Jo 周四晚上都有空。",
  "Thursday works for both": "周四两人都可以", "Thursday · 6 PM": "周四 · 下午 6 点", "{} going": "{} 人去", "{} · Alex and Jo are going": "{} · Alex 和 Jo 会去",
  "You’re going · friends can see it": "你会去 · 好友能看到", "You’re going · undo": "你会去 · 撤销", "See group climbs": "查看组队攀岩",
  "Beginner night · Wed 7 PM": "新手之夜 · 周三晚 7 点", "Beginner night is Wednesday at 7 PM at {}.": "新手之夜在周三晚 7 点，地点 {}。",
  "{} · open to everyone, a coach shows the basics": "{} · 对所有人开放，教练讲基础", "every other Friday": "隔周周五",
  "Alex and Jo · climbs you post show up here for them": "Alex 和 Jo · 你发布的攀爬会出现在他们这里", "Send to Alex and Jo": "发给 Alex 和 Jo", "Sent to Alex and Jo": "已发给 Alex 和 Jo",
  "Copy invite link": "复制邀请链接", "Invite link copied": "邀请链接已复制", "You’ll see each other’s climbs and when you’re free.": "你们能看到彼此的攀爬和空闲时间。",
  "We make a link for them. The clip lands in their log when they join.": "我们为他们生成一个链接。他们加入后片段会进入他们的记录。",
  "The clip lands in their log too.": "片段也会进入他们的记录。", "Add a comment": "写评论", "Comment on {}’s climb": "评论 {} 的攀爬",
  "Playing {}’s send · {}": "正在播放 {} 的完攀 · {}", "topped {} {}": "登顶了 {} {}", "topped Blue V3": "登顶了蓝色 V3", "topped Orange V2": "登顶了橙色 V2",
  "topped Red V4": "登顶了红色 V4", "You topped Orange V2": "你登顶了橙色 V2", "climbs {}": "攀爬 {}", "· no check-ins yet": "· 还没有签到",
  "Add {}": "添加 {}", "At {}": "在 {}", "Planned for you": "为你规划",

  // ---- plurals from n(k, one, many) and small units
  "{} try": "{} 次尝试", "{} tries": "{} 次尝试", "{} top": "{} 次登顶", "{} tops": "{} 次登顶", "{} send": "{} 次完攀", "{} sends": "{} 次完攀",
  "{} video": "{} 个视频", "{} videos": "{} 个视频", "{} clip": "{} 段片段", "{} clips": "{} 段片段", "{} original": "{} 个原视频", "{} originals": "{} 个原视频",
  "{} session": "{} 次攀岩", "{} sessions": "{} 次攀岩", "session since Aug 17": "次 · 自 8 月 17 日起", "sessions since Aug 17": "次 · 自 8 月 17 日起", "{} move": "{} 步", "{} moves": "{} 步", "{} route": "{} 条线路", "{} routes": "{} 条线路",
  "{} climb": "{} 次攀爬", "{} climbs": "{} 次攀爬", "{} s": "{} 秒", "{} of {}": "{}/{}", "{} need": "{} 个", "{} needs": "{} 个",
  "{} V{}": "{} V{}",
  "Gyms": "岩馆", "Gyms near you": "附近的岩馆", "From your location · {}": "根据你的位置 · {}", "{} · from your location": "{} · 根据你的位置", "{} within {} mi": "{1} mi 内有 {0}",
  "none within {} mi": "{} mi 内没有岩馆", "{} gym": "{} 家岩馆", "{} gyms": "{} 家岩馆", "{} mi": "{} mi", "List": "列表", "Map": "地图", "Show as": "显示方式",
  "Your gym": "我的岩馆", "Directions": "导航", "Directions to {}": "导航去 {}", "Open in Maps": "在地图中打开", "Tap a gym on the map to see it.": "轻点地图上的岩馆查看详情。", "The map needs an internet connection. The list works without one.": "地图需要联网。列表不联网也能用。", "Zoom in": "放大", "Zoom out": "缩小",
  "Opening {} in Maps · {}, {}": "正在地图中打开 {} · {}，{}", "{} is your gym": "{} 已设为你的岩馆", "{} farther than {} mi · show more": "还有 {} 在 {} mi 以外 · 显示更多",
  "{} is your gym · list or map": "{} 是你的岩馆 · 列表或地图", "Quiet {}": "人少 · {}", "Busy {}": "人多 · {}", "till 5 PM": "到下午 5 点", "till 7 PM": "到下午 7 点", "till 8 PM": "到晚上 8 点", "time": "时长", "tries": "尝试", "sends": "完攀", "tops": "登顶", "try": "尝试", "send": "完攀", "top": "登顶",
  "{} topped {}": "{} 登顶了 {}", "trimmed from {}": "从 {} 剪出",
  "{}, {}": "{}，{}", "· {}": "· {}",

  "Version 8 · photos from Unsplash, gym photos and info from each gym’s website (Nov 2026), videos from Wikimedia Commons and Pexels · people, crowds and numbers are placeholders": "第 8 版 · 照片来自 Unsplash，岩馆照片和信息来自各岩馆官网（2026 年 11 月），视频来自 Wikimedia Commons 和 Pexels · 人物、人流和数字均为示例",
  "Spotter app prototype": "Spotter 应用原型",
};

(() => {
  const exact = new Map(), pats = [];
  for (const [k, v] of Object.entries(ZH)) {
    if (!k.includes('{}')) { exact.set(k, v); continue; }
    const lit = k.replace(/\{\}/g, '').length;
    const re = new RegExp('^' + k.split('{}').map(s => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&')).join('(.*?)') + '$');
    pats.push({ re, v, lit });
  }
  pats.sort((a, b) => b.lit - a.lit);
  const cache = new Map();
  const fill = (v, parts) => { let i = 0; return v.replace(/\{(\d?)\}/g, (_, d) => parts[d === '' ? i++ : +d] ?? ''); };
  // dates first, wherever they sit: "Sat, Oct 31" → 10 月 31 日 周六, "Oct 24" → 10 月 24 日
  const DAY = { Mon: '周一', Tue: '周二', Wed: '周三', Thu: '周四', Fri: '周五', Sat: '周六', Sun: '周日' }, MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  const dates = t => t.replace(/\b(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun), )?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})\b/g, (_, d, m, n) => `${MON[m]} 月 ${n} 日${d ? ' ' + DAY[d] : ''}`);
  function zh(t, depth = 0) {
    if (!t || !/[A-Za-z]/.test(t)) return t;
    if (exact.has(t)) return exact.get(t);
    if (cache.has(t)) return cache.get(t);
    const key = t;
    t = dates(t);
    if (exact.has(t)) return exact.get(t);
    let out = null;
    // a piece filled into {} never spans a " · ": those are separate pieces, translated one by one below
    if (depth < 4) for (const p of pats) {
      const m = t.match(p.re);
      if (m && !m.slice(1).some(x => x.includes(' · '))) { out = fill(p.v, m.slice(1).map(x => zh(x.trim(), depth + 1))); break; }
    }
    if (out === null && t.includes(' · ')) out = t.split(' · ').map(x => zh(x, depth + 1)).join(' · ');
    if (out === null) out = t;
    cache.set(key, out);
    return out;
  }

  const ATTRS = ['aria-label', 'alt', 'placeholder', 'title'];
  const origText = new WeakMap(), origAttr = new WeakMap();
  let lang = 'en';
  try { lang = localStorage.getItem('chalk-lang') || (new URLSearchParams(location.search).get('lang') === 'zh' ? 'zh' : 'en'); } catch { }

  // a text node keeps its spaces around the translated words, so "<b>Move 4 of 6</b> is your closest" still reads
  function doText(node) {
    const raw = node.nodeValue, t = raw.replace(/\s+/g, ' ').trim();
    if (!t) return;
    const z = zh(t);
    if (z === t) return;
    origText.set(node, raw);
    node.nodeValue = raw.replace(/^\s*/, m => m ? ' ' : '').replace(/\s*$/, m => m ? ' ' : '').replace(/\S[\s\S]*\S|\S/, () => z);
  }
  function doAttrs(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (!v) continue;
      const z = zh(v.trim());
      if (z === v) continue;
      const o = origAttr.get(el) || {}; if (!(a in o)) o[a] = v; origAttr.set(el, o);
      el.setAttribute(a, z);
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 || root.closest('script,style')) return;
    doAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) n.nodeType === 3 ? doText(n) : doAttrs(n);
  }
  function restore(root) {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (n.nodeType === 3) { if (origText.has(n)) { n.nodeValue = origText.get(n); origText.delete(n); } }
      else if (origAttr.has(n)) { for (const [a, v] of Object.entries(origAttr.get(n))) n.setAttribute(a, v); origAttr.delete(n); }
    }
  }
  // app.js reads a button's words in one place (who filmed you); this gives it the English back
  window.enText = el => { const t = el.firstChild && origText.get(el.firstChild); return (t ?? el.textContent).trim(); };

  const obs = new MutationObserver(list => {
    if (lang !== 'zh') return;
    obs.disconnect();
    for (const m of list) {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
      else m.addedNodes.forEach(walk);
    }
    watch();
  });
  const watch = () => obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  function apply() {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
    obs.disconnect();
    if (lang === 'zh') walk(document.body); else restore(document.body);
    watch();
    const b = document.querySelector('.hw.vdn');
    if (b) { b.setAttribute('aria-pressed', lang === 'zh'); }
  }
  document.querySelector('.hw.vdn')?.addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem('chalk-lang', lang); } catch { }
    apply();
    toast(lang === 'zh' ? '已切换为中文 · 再按一次音量减切回英文' : 'Switched to English · press volume down again for 中文');
  });
  apply();
})();
