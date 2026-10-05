const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
// 获取openid
const getOpenId = async () => {
  // 获取基础信息
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};

// 获取小程序二维码
const getMiniProgramCode = async () => {
  // 获取小程序二维码的buffer
  const resp = await cloud.openapi.wxacode.get({
    path: "pages/index/index",
  });
  const { buffer } = resp;
  // 将图片上传云存储空间
  const upload = await cloud.uploadFile({
    cloudPath: "code.png",
    fileContent: buffer,
  });
  return upload.fileID;
};

// 创建集合
const createCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("sales");
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华东",
        city: "上海",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华东",
        city: "南京",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华南",
        city: "广州",
        sales: 22,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华南",
        city: "深圳",
        sales: 22,
      },
    });
    return {
      success: true,
    };
  } catch (e) {
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: true,
      data: "create collection success",
    };
  }
};

// 查询数据
const selectRecord = async () => {
  // 返回数据库查询结果
  return await db.collection("sales").get();
};

// 更新数据
const updateRecord = async (event) => {
  try {
    // 遍历修改数据库信息
    for (let i = 0; i < event.data.length; i++) {
      await db
        .collection("sales")
        .where({
          _id: event.data[i]._id,
        })
        .update({
          data: {
            sales: event.data[i].sales,
          },
        });
    }
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 新增数据
const insertRecord = async (event) => {
  try {
    const insertRecord = event.data;
    // 插入数据
    await db.collection("sales").add({
      data: {
        region: insertRecord.region,
        city: insertRecord.city,
        sales: Number(insertRecord.sales),
      },
    });
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 删除数据
const deleteRecord = async (event) => {
  try {
    await db
      .collection("sales")
      .where({
        _id: event.data._id,
      })
      .remove();
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 首次进入时写入的示例小组（方便直接看到效果）
const SAMPLE_GROUPS = [
  { name: "深圳周末徒步", intro: "每周六早上出发，梧桐山 / 大鹏海边，欢迎新朋友", limit: 20 },
  { name: "城市读书会", intro: "每月共读一本书，线上讨论 + 线下分享", limit: 30 },
  { name: "周末摄影团", intro: "扫街、拍海、拍日落，手机相机都行", limit: 15 },
];

// 小组列表（含人数、我是否已加入）
const listGroups = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 集合不存在就创建（已存在会抛错，忽略）
  try {
    await db.createCollection("groups");
  } catch (e) {}
  try {
    await db.createCollection("groupMembers");
  } catch (e) {}

  // 集合为空时写入示例数据，保证页面有内容可看
  const check = await db.collection("groups").limit(1).get();
  if (check.data.length === 0) {
    for (let i = 0; i < SAMPLE_GROUPS.length; i++) {
      const g = SAMPLE_GROUPS[i];
      await db.collection("groups").add({
        data: {
          name: g.name,
          intro: g.intro,
          limit: g.limit,
          ownerOpenid: openid,
          createdAt: db.serverDate(),
        },
      });
    }
  }

  const groupsRes = await db.collection("groups").limit(50).get();
  const membersRes = await db.collection("groupMembers").limit(1000).get();
  const members = membersRes.data || [];

  const list = groupsRes.data.map((g) => {
    const groupMembers = members.filter((m) => m.groupId === g._id);
    return {
      _id: g._id,
      name: g.name,
      intro: g.intro,
      limit: g.limit || 0,
      memberCount: groupMembers.length,
      joined: groupMembers.some((m) => m.openid === openid),
      owner: g.ownerOpenid === openid,
    };
  });

  return { success: true, data: list };
};

// 加入小组
const joinGroup = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const groupId = event.groupId;

  if (!groupId) {
    return { success: false, errMsg: "缺少小组 ID" };
  }

  try {
    await db.createCollection("groupMembers");
  } catch (e) {}

  let groupRes = null;
  try {
    groupRes = await db.collection("groups").doc(groupId).get();
  } catch (e) {
    groupRes = null;
  }
  if (!groupRes || !groupRes.data) {
    return { success: false, errMsg: "小组不存在" };
  }

  const exist = await db
    .collection("groupMembers")
    .where({ groupId, openid })
    .get();
  if (exist.data.length > 0) {
    const count = await db.collection("groupMembers").where({ groupId }).count();
    return { success: true, already: true, memberCount: count.total };
  }

  await db.collection("groupMembers").add({
    data: {
      groupId,
      openid,
      joinedAt: db.serverDate(),
    },
  });

  const count = await db.collection("groupMembers").where({ groupId }).count();
  return { success: true, memberCount: count.total };
};

// 创建小组（创建者自动成为成员）
const createGroup = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const name = String(event.name || "").trim();
  const intro = String(event.intro || "").trim();
  const limit = Number(event.limit) || 0;

  if (!name) {
    return { success: false, errMsg: "请填写小组名称" };
  }
  if (name.length > 20) {
    return { success: false, errMsg: "小组名称请控制在 20 字以内" };
  }

  try {
    await db.createCollection("groups");
  } catch (e) {}
  try {
    await db.createCollection("groupMembers");
  } catch (e) {}

  const dup = await db
    .collection("groups")
    .where({ name, ownerOpenid: openid })
    .get();
  if (dup.data.length > 0) {
    return { success: false, errMsg: "你已经创建过同名的小组" };
  }

  const addRes = await db.collection("groups").add({
    data: {
      name,
      intro: intro.slice(0, 100),
      limit,
      ownerOpenid: openid,
      createdAt: db.serverDate(),
    },
  });

  // 创建者自动加入
  await db.collection("groupMembers").add({
    data: {
      groupId: addRes._id,
      openid,
      joinedAt: db.serverDate(),
    },
  });

  return { success: true, groupId: addRes._id };
};

// 我的小组（我加入过的小组）
const myGroups = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    await db.createCollection("groupMembers");
  } catch (e) {}

  const mine = await db
    .collection("groupMembers")
    .where({ openid })
    .limit(200)
    .get();
  const ids = (mine.data || []).map((m) => m.groupId);
  if (ids.length === 0) {
    return { success: true, data: [] };
  }

  const groupsRes = await db
    .collection("groups")
    .where({ _id: db.command.in(ids) })
    .limit(200)
    .get();
  const membersRes = await db.collection("groupMembers").limit(1000).get();
  const members = membersRes.data || [];

  const list = groupsRes.data.map((g) => ({
    _id: g._id,
    name: g.name,
    intro: g.intro,
    limit: g.limit || 0,
    memberCount: members.filter((m) => m.groupId === g._id).length,
    joined: true,
    owner: g.ownerOpenid === openid,
  }));

  return { success: true, data: list };
};

// 小组详情（含成员列表）
const groupDetail = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const groupId = event.groupId;

  if (!groupId) {
    return { success: false, errMsg: "缺少小组 ID" };
  }

  let groupRes = null;
  try {
    groupRes = await db.collection("groups").doc(groupId).get();
  } catch (e) {
    groupRes = null;
  }
  if (!groupRes || !groupRes.data) {
    return { success: false, errMsg: "小组不存在" };
  }

  const g = groupRes.data;
  const membersRes = await db
    .collection("groupMembers")
    .where({ groupId })
    .limit(200)
    .get();
  const members = membersRes.data || [];

  // 从资料表里取成员昵称
  const openids = members.map((m) => m.openid);
  let profiles = [];
  if (openids.length > 0) {
    try {
      const profilesRes = await db
        .collection("profiles")
        .where({ openid: db.command.in(openids) })
        .limit(200)
        .get();
      profiles = profilesRes.data || [];
    } catch (e) {
      profiles = [];
    }
  }

  const list = members.map((m) => {
    const p = profiles.find((x) => x.openid === m.openid);
    return {
      openid: m.openid,
      nickname: (p && p.nickname) || "微信用户",
      gender: (p && p.gender) || "",
      isOwner: g.ownerOpenid === m.openid,
      isMe: m.openid === openid,
    };
  });

  return {
    success: true,
    data: {
      _id: groupId,
      name: g.name,
      intro: g.intro,
      limit: g.limit || 0,
      memberCount: list.length,
      owner: g.ownerOpenid === openid,
      joined: list.some((m) => m.isMe),
      members: list,
    },
  };
};

// 退出小组（创建者不能退出）
const leaveGroup = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const groupId = event.groupId;

  if (!groupId) {
    return { success: false, errMsg: "缺少小组 ID" };
  }

  let groupRes = null;
  try {
    groupRes = await db.collection("groups").doc(groupId).get();
  } catch (e) {
    groupRes = null;
  }
  if (groupRes && groupRes.data && groupRes.data.ownerOpenid === openid) {
    return { success: false, errMsg: "你是这个小组的创建者，不能退出" };
  }

  const res = await db
    .collection("groupMembers")
    .where({ groupId, openid })
    .remove();
  if (!res.stats || res.stats.removed === 0) {
    return { success: false, errMsg: "你还没有加入这个小组" };
  }

  const count = await db.collection("groupMembers").where({ groupId }).count();
  return { success: true, memberCount: count.total };
};

// 保存用户资料（form 页提交）
const saveProfile = async (event) => {
  // 身份以 openid 为准，不信任前端传上来的任何用户标识
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { nickname, gender, date, region, regionCode, code, info } = event;

  // ① 服务端校验
  if (!nickname || !String(nickname).trim()) {
    return { success: false, errMsg: "昵称必填" };
  }
  if (!["nan", "nv"].includes(gender)) {
    return { success: false, errMsg: "性别不合法" };
  }

  // ② 规范化：把界面用的值转成适合入库的值
  const area = Array.isArray(region) ? region : [];
  const codes = Array.isArray(regionCode) ? regionCode : [];

  const doc = {
    openid,
    nickname: String(nickname).trim().slice(0, 32),
    gender,
    birthYear: /^\d{4}$/.test(String(date)) ? Number(date) : null,
    province: area[0] || "",
    city: area[1] || "",
    district: area[2] || "",
    districtCode: codes[2] || codes[0] || "",
    contact: String(code || "").trim().slice(0, 64),
    intro: String(info || "").slice(0, 500),
    updatedAt: db.serverDate(),
  };

  // ③ 集合不存在就创建（已存在会抛错，忽略即可）
  try {
    await db.createCollection("profiles");
  } catch (e) {
    // 集合已存在
  }

  // ④ 同一个用户只保留一条记录
  const col = db.collection("profiles");
  const exist = await col.where({ openid }).get();
  if (exist.data.length) {
    await col.doc(exist.data[0]._id).update({ data: doc });
  } else {
    await col.add({
      data: Object.assign({}, doc, { createdAt: db.serverDate() }),
    });
  }

  return { success: true, data: doc };
};

// const getOpenId = require('./getOpenId/index');
// const getMiniProgramCode = require('./getMiniProgramCode/index');
// const createCollection = require('./createCollection/index');
// const selectRecord = require('./selectRecord/index');
// const updateRecord = require('./updateRecord/index');
// const fetchGoodsList = require('./fetchGoodsList/index');
// const genMpQrcode = require('./genMpQrcode/index');
// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case "getOpenId":
      return await getOpenId();
    case "getMiniProgramCode":
      return await getMiniProgramCode();
    case "createCollection":
      return await createCollection();
    case "selectRecord":
      return await selectRecord();
    case "updateRecord":
      return await updateRecord(event);
    case "insertRecord":
      return await insertRecord(event);
    case "deleteRecord":
      return await deleteRecord(event);
    case "saveProfile":
      return await saveProfile(event);
    case "listGroups":
      return await listGroups(event);
    case "joinGroup":
      return await joinGroup(event);
    case "createGroup":
      return await createGroup(event);
    case "myGroups":
      return await myGroups(event);
    case "groupDetail":
      return await groupDetail(event);
    case "leaveGroup":
      return await leaveGroup(event);
  }
};
