import { Client, Intents } from 'discord.js'
import 'dotenv/config'
import { token, firebaseConfig } from './config.json'
import { initializeApp } from 'firebase/app';
import { getStorage, getDownloadURL, ref as storageRef } from "firebase/storage";
import { getDatabase, ref, child, query, orderByChild, get, equalTo } from "firebase/database";

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

let prefix = "!";

const commandResolver = (command: string) => prefix + command;
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

interface TeamMateInfo {
    uid: string,
    出戰兵團: string[],
    所屬隊伍: number,
    順位: number,
}

client.on('ready', async () => {

    // const dbRef = ref(database);
    // const discordUserName = "逍遙";
    // const userSnap = await get(query(child(dbRef, `成員`), orderByChild("Discord名稱"), equalTo(discordUserName)))
    // const userDoc = userSnap.val();
    // const user: any = Object.values(userDoc).at(0);
    // if (!user) {
    //     console.log("未註冊系統");
    //     return;
    // }
    // const gameName = user["遊戲名稱"];
    // const TWInfoSnap = await get(child(dbRef, `領土戰隊伍/明天就解散/${gameName}`))
    // const TWInfo = TWInfoSnap.val();
    // if (!TWInfo) {
    //     console.log("未分配隊伍");
    //     return;
    // }
    // const teamNameSnap = await get(child(dbRef, `領土戰隊伍名稱/明天就解散/${TWInfo["所屬隊伍"]}`))
    // const teamName = teamNameSnap.val();
    // console.log(`所屬隊伍: ${teamName}\n出戰兵團: ${(TWInfo["出戰兵團"] as string[]).map((unit, i) => `${i + 1}: ${unit}`)}`)

    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === "ping") {
        await interaction.reply('Pong!');
    }
});

client.on('messageCreate', async message => {

    if (message.content === commandResolver('系統')) {
        await message.reply(`https://deep-sea.web.app/member.html`);
    }
    else if ([commandResolver('隊伍')].includes(message.content)) {
        const dbRef = ref(database);
        const discordUserName = message.author.username;
        const userSnap = await get(query(child(dbRef, `成員`), orderByChild("Discord名稱"), equalTo(discordUserName)))
        const userDoc = userSnap.val();
        if (!userDoc) {
            message.reply("未註冊系統");
            return;
        }
        const user: any = Object.values(userDoc).at(0);
        const gameName = user["遊戲名稱"];
        const TWInfoSnap = await get(child(dbRef, `領土戰隊伍/明天就解散/${gameName}`))
        const TWInfo = TWInfoSnap.val();
        if (!TWInfo) {
            message.reply("未分配隊伍");
            return;
        }
        const teamNameSnap = await get(child(dbRef, `領土戰隊伍名稱/明天就解散/${TWInfo["所屬隊伍"]}`))
        const teamName = teamNameSnap.val();
        const teamTargetSnap = await get(child(dbRef, `領土戰隊伍目標/明天就解散/${TWInfo["所屬隊伍"]}`))
        const teamTarget = teamTargetSnap.val();
        const units = TWInfo["出戰兵團"] as string[] || [];
        const teamMatesSnap = await get(query(child(dbRef, `領土戰隊伍/明天就解散`), orderByChild("所屬隊伍"), equalTo(TWInfo["所屬隊伍"])));
        const teamMates: Record<string, TeamMateInfo> = teamMatesSnap.val();
        let teamMatesInfo: string[] = [];
        if (TWInfo["順位"] == "0") {
            for (const userName in teamMates) {
                if (userName == gameName) continue;
                const units = teamMates[userName]["出戰兵團"] || [];
                teamMatesInfo.push(`${userName}(${units.join(", ")})`)
            }
            message.reply(`
                所屬隊伍: ${teamName} (隊長)\n目標: ${teamTarget}\n出戰兵團: ${units.map((unit, i) => ` 第${i + 1}順位- ${unit}`)}\n隊員: ${teamMatesInfo.join(", ")}
            `)
        }
        else {
            let leader = "無";
            for (const userName in teamMates) {
                if (userName == gameName) continue;
                if (teamMates[userName].順位 == 0)
                    leader = userName;
                const units = teamMates[userName]["出戰兵團"] || [];
                teamMatesInfo.push(`${userName}(${units.join(", ")})`)
            }
            message.reply(`
                所屬隊伍: ${teamName} (隊員)\n隊長為: ${leader}\n目標: ${teamTarget}\n出戰兵團: ${units.map((unit, i) => ` 第${i + 1}順位- ${unit}`)}\n隊員: ${teamMatesInfo.join(", ")}
            `)
        }
    }
    else if (message.content === commandResolver('teams')) {
        const dbRef = ref(database);
        const teamMatesSnap = await get(query(child(dbRef, `領土戰隊伍/明天就解散`)));
        const teamMates = teamMatesSnap.val();
        let teamMatesInfo: string[][] = [];
        for (const userName in teamMates) {
            const units = teamMates[userName]["出戰兵團"] || [];
            teamMatesInfo[teamMates[userName]["所屬隊伍"]] = teamMatesInfo[teamMates[userName]["所屬隊伍"]] || [];
            if (teamMates[userName]["順位"] == 0)
                teamMatesInfo[teamMates[userName]["所屬隊伍"]].push(`**${userName}** *(${units.join(", ")})*`);
            else
                teamMatesInfo[teamMates[userName]["所屬隊伍"]].push(`${userName} *(${units.join(", ")})*`);
        }
        let teamsInfo: string[] = [];
        for (const info in teamMatesInfo) {
            teamsInfo.push(`第${info}隊:\n${teamMatesInfo[info].join(" , ")}\n`);
        }
        const reply = teamsInfo.join("\n");
        message.reply(reply);
    }
    else if (message.content.startsWith(commandResolver("地圖"))) {
        const map = message.content.split(" ")[1];
        if (!map) message.reply("請輸入地圖");
        let mapName = "";
        switch (map) {
            case "靜寧關":
            case "靜甯關":
                mapName = "jingNingGuan";
                break;

            case "攏城關":
                mapName = "LongCheng";
                break;

            case "東方村":
                mapName = "yunChuanVillage";
                break;

            case "玄機城":
                mapName = "yunChuanCity2";
                break;

            case "白鹿關":
                mapName = "yunChuanCity1";
                break;

            case "雲川":
                mapName = "yunChuan";
                break;

            case "王城大門":
                mapName = "royalPass";
                break;

            case "王城":
                mapName = "royal";
                break;

            case "西方村":
            case "西木村":
                mapName = "peiYaVillage";
                break;

            case "西方村2":
                mapName = "peiYaVillage2";
                break;

            case "西方村3":
            case "沙漠村":
                mapName = "canyon";
                break;

            case "西方村4":
            case "沙漠村2":
                mapName = "ghostTown";
                break;

            case "經典西方城":
            case "艾倫堡":
                mapName = "peiYaCity1";
                break;

            case "得利之門":
            case "德利之門":
                mapName = "peiYaCity2";
                break;

            case "西方關":
            case "西方關口":
                mapName = "peiYaPass";
                break;

            case "佩牙":
            case "佩牙利斯":
                mapName = "peiYa";
                break;

            case "日燁城":
                mapName = "moYuanCity";
                break;

            case "漠原":
                mapName = "moYuan";
                break;

            case "蒙古村":
                mapName = "mengGu";
                break;

            case "混亂北":
                mapName = "hunLuanN";
                break;

            case "混亂南":
                mapName = "hunLuan";
                break;

            case "德茂":
                mapName = "deMao";
                break;

            case "巴爾":
            case "巴爾托利亞":
                mapName = "baEr";
                break;

            default:
                mapName = map;
                break;
        }
        getDownloadURL(storageRef(storage, `${mapName}.png`)).then(url => {
            message.reply(url);
        })
    }
});


client.login(token);