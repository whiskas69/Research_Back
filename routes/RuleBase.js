const express = require("express");
const db = require("../config.js");
const country = require("./Country.json");

router = express.Router();

const scoreStandard = (typeScore, total, standard, core) => {
    console.log("scoreStandard")
    console.log("typeScore", typeScore)
    console.log("total", total)
    let result = "";
    if (standard == "มาตรฐาน" && typeScore == null) {
        return result = "มาตรฐาน"
    } else {
        if (typeScore == "SJR") {
            console.log("typeScore", typeScore);
            if (total >= 4) {
                console.log("ดีมากคับ ไม่คิดค่าลงทะเบียน: ", total);
                result = "ดีมาก"
                //   "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน สามารถเบิกได้ตามเงื่อนไขในประกาศสถาบัน
                // ระดับมาตรฐาน คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน";
                return result;
            } else {
                result = "มาตรฐาน"
                // "สามารถเบิกได้ตามเงื่อนไขในประกาศสถาบัน";
                // res.status(200).json({ message: "" });
                return result;
            }
        } else if (typeScore == "CIF") {
            console.log("typeScore", typeScore);
            if (total >= 9.38) {
                console.log("ดีมากคับ ไม่คิดค่าลงทะเบียน: ", total);
                result = "ดีมาก"
                return result;
            } else {
                result = "มาตรฐาน"
                // res.status(200).json({ message: "ระดับมาตรฐาน คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" });
                return result;
            }
        } else if (typeScore == "CORE") {
            console.log("typeScore", typeScore);
            if (core == "A" || core == "A*" || core == "A+") {
                console.log("ดีมากคับ ไม่คิดค่าลงทะเบียน: ", core);
                result = "ดีมาก"
                return result;
            } else {
                result = "มาตรฐาน"
                // res.status(200).json({ message: "ระดับมาตรฐาน คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" });
                return result;
            }
        } else {
            result = "ไม่พบ typeScore ในเงื่อนไข"
            return result;
        }
    }
}

const checkWithdraw = (half_full, withdraw_100, wd_name_100, file_full_100) => {
    let withdraw = ""
    if (half_full == "50%") {
        withdraw = "50%";
        console.log("withdraw checkWithdraw", withdraw);
        return withdraw;
    } else if (half_full == "100%") {
        if (["WoS-Q1", "WoS-Q2", "WoS-Q3", "SJR-Q1", "SJR-Q2"].includes(withdraw_100)) {
            if (wd_name_100 != null || wd_name_100 != "") {
                console.log("wd_name_100", wd_name_100);
                console.log("withdraw", withdraw);
                if (file_full_100 != null || file_full_100 != "") {
                    withdraw = "100%";
                    return withdraw;
                }
            } else {
                console.log("ไม่ตรงเงื่อนไขการขอรับการสนับสนุน การขอรับสนับสนุน 100%");

                withdraw = "ไม่ตรงเงื่อนไขการขอรับการสนับสนุน การขอรับสนับสนุน 100%"
                return withdraw;
            }
        }
    }
}

const getMaxExpense = (place, In_Out_Country) => {
    let result = { maxExpense: 0, inThai: "", locat: "" };
    console.log("getMaxExpense")
    if (In_Out_Country == "ณ ต่างประเทศ") {
        console.log("getMaxExpense ต่างประเทศ : ", place)
        for (const category in country) {
            const data = country[category];
            if (Array.isArray(data.countries) && data.countries.includes(place)) {
                result.maxExpense = data.max_expense;
                result.locat = 'Out_Country'
                break;
            }
        }
    } else if (In_Out_Country == "ในประเทศ") {
        console.log("getMaxExpense ในประเทศ : ", place)
        if (["กรุงเทพ", "นนทบุรี", "สมุทรปราการ", "ปทุมธานี", "ฉะเชิงเทรา"].includes(place)) {
            result.inThai = "ไม่สามารถเบิกค่าเบี้ยเลี้ยงเดินทางได้";
            result.locat = 'In_Country'
        } else {
            result.inThai = "ค่าเบี้ยเลี้ยงเดินทาง <= 300 บาท/คน/วัน";
            result.locat = 'In_Country'
        }
    }
    return result;
};

router.get("/confer/calc/:id", async (req, res) => {
    const { id } = req.params;
    console.log("confer id", id);
    try {
        const confer = await db.query(
            `SELECT * FROM conference WHERE conf_id = ?`,
            [id]
        );
        const score = await db.query(`SELECT * FROM score WHERE conf_id = ?`, [id]);
        const file = await db.query(`SELECT * FROM file_pdf WHERE conf_id = ?`, [
            id,
        ]);
        const user_work = await db.query(`SELECT user_confer FROM Users WHERE user_id = ?`, [confer[0][0].user_id])

        const Author = confer[0][0].presenter_type;
        const In_Out_Country = confer[0][0].country_conf;
        const In_Out_Scopus = confer[0][0].meeting_type;
        const Leave = confer[0][0].time_of_leave;
        const Sec_Leave = confer[0][0].wos_2_leave;
        const Sec_Leave_name = confer[0][0].name_2_leave;
        const standard = confer[0][0].quality_meeting;

        //ต้องเรียกมาจากตาราง officers_opinion_conf
        const year_work = user_work[0][0].user_confer; //1= >=3 //check เป็นพนักงานสถาบันที่ปฏิบัติงานมาแล้วไม่เกิน 3 ปีนับตั้งแต่วันบรรจุและยังไม่เคยลาเข้าร่วมประชุมทางวิชาการ ณ ต่างประเทศ
        const namePlace = confer[0][0].location; // เรียกชื่อประเทศที่จารจะไป

        const score_type = score[0][0].score_type;
        const total_score = score[0][0].score_result;
        const core = score[0][0].core_rank;
        // if score
        let result = scoreStandard(score_type, total_score, standard, core);
        console.log("ค่า result:", result);

        const half_full = confer[0][0].withdraw
        const withdraw_100 = confer[0][0].wd_100_quality;
        const wd_name_100 = confer[0][0].wd_name_100;
        const file_full_100 = file[0][0].published_journals;
        // if 50 or 100
        let withdraw = checkWithdraw(half_full, withdraw_100, wd_name_100, file_full_100);
        console.log("ค่า withdraw:", withdraw);

        let finalSum = getMaxExpense(namePlace, In_Out_Country);
        console.log("ค่า max_expense:", finalSum);

        console.log("all");
        // if all
        if (Author == "First Author" || Author == "Corresponding Author") {
            console.log("inif");
            console.log("Author", Author);

            //ส่วนในประเทศ
            if (In_Out_Country == "ภายในประเทศ") {
                console.log("In_Out_Country");
                console.log("In_Out_Country", In_Out_Country);

                //ได้รับการสนับสนุนจากคณะ
                if (In_Out_Scopus == "คณะจัด ไม่อยู่scopus") {
                    console.log("In_Out_Scopus", In_Out_Scopus);
                    //คิดจังหวัด
                    return res.status(200).json({message: "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน", 
                        inthai: finalSum.inThai == 'ไม่สามารถเบิกค่าเบี้ยเลี้ยงเดินทางได้' ?  'ไม่สามารถเบิกค่าเบี้ยเลี้ยงเดินทางได้' : 'ค่าเบี้ยเลี้ยงเดินทาง <= 300 บาท/คน/วัน',
                        inOutC: finalSum.locat,
                        money: confer[0][0].all_money >= 8000 ? 8000 : confer[0][0].all_money
                    })
                    //ทำตามเกณฑ์ปกติ
                } else if (In_Out_Scopus == "อยู่ในscopus") {
                    console.log("In_Out_Scopus", In_Out_Scopus);
                    //ระดับไหน => คิดจังหวัด
                    //ลาได้มากสุด 2 ครั้ง
                    if (Leave < 3 && Leave != 0) {
                        console.log("Leave", Leave);
                        console.log("สมมติว่ามีเรื่องตีพิม ตีพิมพ์เรื่องเต็มใน Proceeding");
                        return res.status(200).json({message: 
                            result == "ดีมาก" ? "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" : "คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน", 
                            inthai: finalSum.inThai == 'ไม่สามารถเบิกค่าเบี้ยเลี้ยงเดินทางได้' ?  'ไม่สามารถเบิกค่าเบี้ยเลี้ยงเดินทางได้' : 'ค่าเบี้ยเลี้ยงเดินทาง <= 300 บาท/คน/วัน',
                            inOutC: finalSum.locat,
                            money: confer[0][0].all_money >= 8000 ? 8000 : confer[0][0].all_money
                        })

                    } else {
                        console.log("can't go confer");
                        res
                            .status(200)
                            .json({
                                message:
                                    "ไม่สามารถขอรับการสนับสนุนได้ เนื่องจากไปครบ 2 ครั้งแล้ว",
                            });
                    }
                }
            }

            //ส่วนต่างประเทศ
            else if (In_Out_Country == "ณ ต่างประเทศ") {
                console.log("In_Out_Country", In_Out_Country);

                //ได้รับการสนับสนุนจากคณะ
                if (In_Out_Scopus == "คณะจัด ไม่อยู่scopus") {
                    console.log("In_Out_Scopus", In_Out_Scopus);
                    //เข้า loop ดูว่าเบิกได้เท่าไหร่
                    //ถ้าเช้ค 50 100 befor year_work 
                    //check เวลาการทำงานและเคยไปประชุมไหม
                    if (year_work == 0) {
                        console.log("year_work", year_work);
                        //ไม่เคยไป และทำงานไม่ถึง 3 ปี
                        //เบิก 50 ทันที
                        return res.status(200).json({ 
                            message: "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน", 
                            money: withdraw == "50%" ? finalSum.maxExpense / 2 : finalSum.maxExpense,
                            inOutC: finalSum.locat
                        })
                    } else {
                        console.log("year_work", year_work);
                        //เคยไป หรือ ทำงานเกิน 3 ปี
                        //ต้องพิจารณาอีกทีว่า 50/ 100
                        return res.status(200).json({ 
                            message: "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน", 
                            money: withdraw == "50%" ? finalSum.maxExpense / 2 : finalSum.maxExpense,
                            inOutC: finalSum.locat
                        })
                    }
                }
                //ทำตามเกณฑ์ปกติ
                else if (In_Out_Scopus == "อยู่ในscopus") {
                    console.log("In_Out_Scopus", In_Out_Scopus);
                    //ลาตามเกณฑ์ปกติ
                    if (Leave == 1) {
                        console.log("Leave", Leave);
                        //เข้า loop ดูว่าเบิกได้เท่าไหร่
                        //check เวลาการทำงานและเคยไปประชุมไหม
                        if (year_work == 0) {
                            console.log("year_work = 0", year_work);
                            //ไม่เคยไป และทำงานไม่ถึง 3 ปี
                            //เบิก 50 ทันที
                                console.log("withdraw", withdraw);
                                return res.status(200).json({ message: 
                                    result == "ดีมาก" ? "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" : "คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน", 
                                    money: withdraw == "50%" ? finalSum.maxExpense / 2 : finalSum.maxExpense, 
                                    inOutC: finalSum.locat 
                                })
                        } else {
                            console.log("year_work", year_work);
                            //เคยไป หรือ ทำงานเกิน 3 ปี
                            //ต้องพิจารณาอีกทีว่า 50/ 100
                            return res.status(200).json({ message: 
                                result == "ดีมาก" ? "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" : "คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน", 
                                money: withdraw == "50%" ? finalSum.maxExpense / 2 : finalSum.maxExpense, 
                                inOutC: finalSum.locat 
                            })
                        }
                    }
                    //ลาเกินเกณฑ์
                    else if (Leave == 2) {
                        console.log("Leave", Leave);

                        //มีบทความข้อเพิ่ม
                        if (Sec_Leave == "WoS-Q1" || Sec_Leave == "WoS-Q2") {
                            console.log("Sec_Leave", Sec_Leave);

                            //check ว่าได้แนบชื่อมาด้วย
                            if (Sec_Leave_name != null || Sec_Leave_name != "") {
                                console.log("Sec_Leave_name", Sec_Leave_name);

                                //เข้า loop ดูว่าเบิกได้เท่าไหร่
                                //check เวลาการทำงานและเคยไปประชุมไหม
                                if (year_work == 0) {
                                    console.log("year_work", year_work);
                                    //ไม่เคยไป และทำงานไม่ถึง 3 ปี
                                    //เบิก 50 ทันที
                                    return res.status(200).json({ message: 
                                        result == "ดีมาก" ? "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" : "คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน", 
                                        money: withdraw == "50%" ? finalSum.maxExpense / 2 : finalSum.maxExpense, 
                                        inOutC: finalSum.locat 
                                    })
                                } else {
                                    console.log("year_work", year_work);
                                    //เคยไป หรือ ทำงานเกิน 3 ปี
                                    //ต้องพิจารณาอีกทีว่า 50/ 100
                                    return res.status(200).json({ message: 
                                        result == "ดีมาก" ? "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" : "คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน", 
                                        money: withdraw == "50%" ? finalSum.maxExpense / 2 : finalSum.maxExpense, 
                                        inOutC: finalSum.locat 
                                    })
                                }
                            } else {
                                console.log("ไม่ตรงเงื่อนไขการขอรับการสนับสนุน");

                                res
                                    .status(200)
                                    .json({ message: "ไม่ตรงเงื่อนไขการขอรับการสนับสนุน" });
                            }
                        }
                        // ไม่มี
                        else {
                            console.log("ไม่ตรงเงื่อนไขการขอรับการสนับสนุน ในการลาครั้งที่ 2");

                            res
                                .status(200)
                                .json({ message: "ไม่ตรงเงื่อนไขการขอรับการสนับสนุน ในการลาครั้งที่ 2" });
                        }
                    }
                }
            }
            res.status(200).json({ message: result });
        } else {
            console.log(
                "ไม่ตรงเงื่อนไขการขอรับการสนับสนุนเรื่องผู้นำเสนอ หรือผู้วิจัยหลัก"
            );

            res
                .status(200)
                .json({
                    message:
                        "ไม่ตรงเงื่อนไขการขอรับการสนับสนุนเรื่องผู้นำเสนอ หรือผู้วิจัยหลัก",
                });
        }
    } catch (err) {
        res.status(500).json({ error789: err.message });
    }
});

router.get("/page_charge/calc/:id", async (req, res) => {
    const { id } = req.params;

    let withdrawn = 0; //เงินที่เบิกได้
    let quartile = "";

    try {
        const [page_charge] = await db.query(
            "SELECT * FROM Page_Charge WHERE pageC_id = ?",
            [id]
        );

        if (!page_charge.length) {
            return res.status(404).json({ message: "page_charge not found" });
        }

        const money_request = page_charge[0].request_support;
        const quality_journal = page_charge[0].quality_journal;
        const journal_name = page_charge[0].journal_name;
        const qt_isi = page_charge[0].qt_isi;
        const qt_sjr = page_charge[0].qt_sjr;
        const qt_scopus = page_charge[0].qt_scopus;

        //check quartile
        if (qt_isi == 1 || qt_sjr == 1 || qt_scopus == 1) {
            quartile = 1;
        } else if (qt_isi == 2 || qt_sjr == 2 || qt_scopus == 2) {
            quartile = 2;
        } else if (qt_isi == 3 || qt_sjr == 3 || qt_scopus == 3) {
            quartile = 3;
        } else if (qt_isi == 4 || qt_sjr == 4 || qt_scopus == 4) {
            quartile = 4;
        }

        console.log("Get page_charge: ", page_charge[0]);

        for (let i = 0; i < quality_journal.length; i++) {
            console.log("checking journal", quality_journal[i]);

            if (quality_journal[i] === "nature") {
                console.log("Journal is 'nature'");

                withdrawn = money_request < 70000 ? money_request : 70000;
                break; //ออกจาก loop
            } else {
                const keyword = ["mdpi", "frontiers", "hindawi"];

                const filterword = journal_name
                    .split(" ")
                    .filter((word) => word.includes(keyword));

                if (filterword.length > 0) {
                    console.log("have filterword: ", filterword);
                    console.log(quartile);

                    if (quartile == 1) {
                        withdrawn = money_request < 60000 ? money_request : 60000;

                        break;
                    } else if (quartile == 2) {
                        withdrawn = money_request >= 40000 ? 40000 : money_request;
                        break;
                    }
                } else {
                    console.log("don't have filterword");
                    if (quartile == 1) {
                        withdrawn = money_request >= 60000 ? 60000 : money_request;
                        break;
                    } else if (quartile == 2) {
                        withdrawn = money_request >= 40000 ? 40000 : money_request;
                        break;
                    } else if (quartile == 3) {
                        withdrawn = money_request < 30000 ? money_request : 30000;
                        break;
                    } else if (quartile == 4) {
                        withdrawn = money_request < 20000 ? money_request : 20000;
                        break;
                    }
                }
            }
        }
        console.log("Final withdrawn:", withdrawn);
        res.status(200).json({ ...page_charge[0], withdrawn });
    } catch (err) {
        console.log(err.message)
        res.status(500).json({ error: err.message });
    }
});

exports.router = router;