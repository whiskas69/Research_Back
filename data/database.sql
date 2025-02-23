-- สร้างตาราง Users 
CREATE TABLE Users ( 
	user_id Integer PRIMARY KEY UNIQUE  AUTO_INCREMENT,
	user_role ENUM('professor', 'admin', 'hr', 'research', 'finance', 'associate', 'dean') NOT NULL,
	user_nameth VARCHAR(255),
	user_nameeng VARCHAR(255),
	user_email VARCHAR(255) NOT NULL, 
	user_signature VARCHAR(255),
	user_moneyPC DECIMAL(10,2),
    user_moneyCF DECIMAL(10,2),
	user_positionth VARCHAR(255) NOT NULL,
    user_positioneng VARCHAR(255) NOT NULL,
    user_startwork date NOT NULL,
    user_year int NOT NULL
);

-- ตารางเอกสารขออนุมัติค่าเดินทาง (Conference)
CREATE TABLE Conference (
    conf_id INTEGER PRIMARY KEY AUTO_INCREMENT UNIQUE,
    user_id INTEGER NOT NULL,
    conf_times INT NOT NULL,
    conf_days DATE NOT NULL,
    trav_dateStart DATE NOT NULL,
    trav_dateEnd DATE NOT NULL,
    conf_research VARCHAR(255) NOT NULL,
    conf_name VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_venue VARCHAR(255) NOT NULL,
    date_submit_orrganizer DATE NOT NULL,
    argument_date_review DATE NOT NULL,
    last_day_register DATE NOT NULL,
    meeting_type ENUM('คณะจัด ไม่อยู่scopus', 'อยู่ในscopus') NOT NULL,
    quality_meeting ENUM('มาตรฐาน', 'ดีมาก') NOT NULL,
    presenter_type ENUM('First Author', 'Corresponding Author') NOT NULL,
    time_of_leave ENUM('1', '2') NOT NULL,
    locattion_1 ENUM('ในประเทศ', 'ต่างประเทศ'),
    wos_2_leave ENUM('WoS-Q1', 'WoS-Q2'),
    name_2_leave VARCHAR(255),
    withdraw ENUM('50%', '100%'),
    wd_100_quality ENUM('WoS-Q1', 'WoS-Q2', 'WoS-Q3', 'SJR-Q1', 'SJR-Q2'),
    wd_name_100 VARCHAR(255),
    country_conf ENUM('ณ ต่างประเทศ', 'ภายในประเทศ') NOT NULL,
    num_register_articles DECIMAL(10,2) NOT NULL,
	regist_amount_1_article DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    domestic_expenses DECIMAL(10,2),
    overseas_expenses DECIMAL(10,2),
    travel_country VARCHAR(255),
    inter_expenses DECIMAL(10,2),
    airplane_tax DECIMAL(10,2),
    num_days_room DECIMAL(10,2),
    room_cost_per_night DECIMAL(10,2),
    total_room DECIMAL(10,2),
    num_travel_days DECIMAL(10,2),
    daily_allowance DECIMAL(10,2),
    total_allowance DECIMAL(10,2),
    all_money DECIMAL(10,2) NOT NULL,
    doc_submit_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
-- ตารางคำนวณคะแนนคุณภาพการประชุมวิชาการ (Score)
CREATE TABLE Score (
    sc_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    conf_id INTEGER NOT NULL UNIQUE,
    score_formular ENUM('SJR', 'CIF', 'CORE') NOT NULL,
    sjr_score DECIMAL(10,2),
    sjr_year INT,
    hindex_score DECIMAL(10,2),
    hindex_year INT,
    citat DECIMAL(10,2),
    score_result DECIMAL(10,2),
    core_rank VARCHAR(255),
    FOREIGN KEY (conf_id) REFERENCES Conference(conf_id)
);
-- ตารางเอกสารขออนุมัติค่า Page Charge (Page_Charge)
CREATE TABLE Page_Charge (
    pageC_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    pageC_times INT NOT NULL,
    pageC_days DATE NOT NULL,
    journal_name VARCHAR(255) NOT NULL,
    quality_journal JSON NOT NULL,
    pc_isi_year INT,
    pc_sjr_year INT,
    pc_scopus_year INT,
    impact_factor DECIMAL(10,2),
    sjr_score DECIMAL(10,2),
    cite_score DECIMAL(10,2),
    support_limit INT NOT NULL,
    article_title VARCHAR(255) NOT NULL,
    vol_journal INT NOT NULL,
    issue_journal INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    ISSN_ISBN VARCHAR(255) NOT NULL,
    submission_date DATE NOT NULL,
	date_review_announce DATE NOT NULL,
    final_date DATE NOT NULL,
    article_research_ject VARCHAR(255) NOT NULL,
    research_type ENUM('วิจัยพื้นฐาน', 'วิจัยประยุกต์', 'วิจัยและพัฒนา', 'อื่นๆ' ) NOT NULL,
    research_type2 VARCHAR(255),
    name_funding_source VARCHAR(255) NOT NULL,
    budget_limit DECIMAL(10,2) NOT NULL,
    annual DECIMAL(10,2) NOT NULL,
    presenter_type ENUM('First Author', 'Corresponding Author') NOT NULL,
    request_support DECIMAL(10,2) NOT NULL,
    doc_submit_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
-- Table for Research_KRIS 
CREATE TABLE Research_KRIS ( 
	kris_id INT AUTO_INCREMENT PRIMARY KEY, 
	user_id INTEGER NOT NULL, 
	name_research_th VARCHAR(255) NOT NULL,
	name_research_en VARCHAR(255) NOT NULL,
	research_cluster JSON NOT NULL,
	res_cluster_other VARCHAR(255),
	res_standard JSON NOT NULL,
	res_standard_trade ENUM('52', '53'), -- เปลี่ยนชื่อด้วยมันเป้นมาตรา 52,53
	h_index DECIMAL(10,2) NOT NULL,
	his_inveninno Varchar (255) NOT NULL,
	participation_percen DECIMAL(10,2) NOT NULL,
	year INTEGER NOT NULL,
	project_periodStart Date NOT NULL,
	project_periodEnd Date NOT NULL,
	doc_submit_date DATE DEFAULT (CURRENT_DATE),
	FOREIGN KEY (user_id) REFERENCES Users(user_id) 
);
ALTER TABLE Research_KRIS MODIFY COLUMN research_cluster JSON;
ALTER TABLE Research_KRIS MODIFY COLUMN res_standard JSON;
ALTER TABLE Research_KRIS MODIFY COLUMN res_standard_trade JSON;
-- สร้างตาราง Form 
CREATE TABLE Form ( 
	form_id INTEGER PRIMARY KEY AUTO_INCREMENT UNIQUE, 
	form_type ENUM('Conference', 'Page_Charge', 'Research_KRIS') NOT NULL, 
	conf_id INTEGER, 
	pageC_id INTEGER,
	kris_id INTEGER,
	form_status ENUM('ฝ่ายบริหารทรัพยากรบุคคล','ฝ่ายบริหารงานวิจัย',  'ฝ่ายบริหารการเงิน', 'รองคณบดี', 'คณบดี','รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ', 'เข้าที่ประชุม') NOT NULL, 
	form_money DECIMAL(10,2) NOT NULL, 
	FOREIGN KEY (conf_id) REFERENCES Conference(conf_id),
	FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id),
	FOREIGN KEY (kris_id) REFERENCES Research_KRIS(kris_id) 
);
-- ตารางเก็บเอกสาร PDF (File_pdf)
CREATE TABLE File_pdf (
	file_id INTEGER PRIMARY KEY AUTO_INCREMENT UNIQUE,
	type ENUM ('Conference', 'Page_Charge','Research_KRIS') NOT NULL,
	conf_id INTEGER,
	pageC_id INTEGER,
	kris_id INTEGER,
	kris_file VARCHAR(255),
	full_page VARCHAR(255), -- confer
	date_published_journals VARCHAR(255),
	published_journals VARCHAR(255),
	q_proof VARCHAR(255),
	call_for_paper VARCHAR(255),
	fee_receipt VARCHAR(255),
	fx_rate_document VARCHAR(255),
	conf_proof VARCHAR(255),
	other_name VARCHAR(255),
	other_file VARCHAR(255),
	pc_proof VARCHAR(255), -- pc
	quartile_order VARCHAR(255),
	q_pc_proof VARCHAR(255),
	invoice_public VARCHAR(255),
	accepted VARCHAR(255), -- canfer && pc
	copy_article VARCHAR(255),
	FOREIGN KEY (conf_id) REFERENCES Conference(conf_id), 
	FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id), 
	FOREIGN KEY (kris_id) REFERENCES Research_KRIS(kris_id)
);
-- Table for Officer's_opinion_pc
CREATE TABLE Officers_opinion_pc ( 
	p_offic_id INT AUTO_INCREMENT PRIMARY KEY, 
	pageC_id INTEGER NOT NULL UNIQUE, 
	p_research_admin ENUM('อนุมัติ', 'รอหนังสือตอบรับ', 'อื่น ๆ'), 
	p_reason VARCHAR(255), 
	p_deputy_dean VARCHAR(255), 
	p_date_accepted_approve DATE, -- วันที่เอกสารได้รับการอนุมัติ
    p_acknowledge ENUM('รับทราบ', 'ไม่อนุมัติ'),
	p_approve_result ENUM('รับทราบ','อนุมัติ', 'ไม่อนุมัติ', 'อื่น ๆ'),
    p_reason_dean_appeove VARCHAR(255),
    research_doc_submit_date DATE DEFAULT (CURRENT_DATE), 
    associate_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    dean_doc_submit_date DATE DEFAULT (CURRENT_DATE),
	FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id)
);
-- Table: Officer's_opinion_conf
CREATE TABLE Officers_opinion_conf ( 
	c_offic_id INTEGER PRIMARY KEY AUTO_INCREMENT, 
	conf_id INTEGER NOT NULL UNIQUE,
	c_research_hr ENUM('ถูกต้อง', 'ไม่ถูกต้อง', 'อื่น ๆ'), 
	c_reason VARCHAR(255), 
	c_meet_quality ENUM('มาตรฐาน', 'ดีมาก'), 
	c_good_reason VARCHAR(255), 
	c_deputy_dean VARCHAR(255), 
	c_approve_result ENUM('รับทราบ', 'ไม่อนุมัติ'),
    hr_doc_submit_date DATE DEFAULT (CURRENT_DATE), 
    research_doc_submit_date DATE DEFAULT (CURRENT_DATE), 
    associate_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    dean_doc_submit_date DATE DEFAULT (CURRENT_DATE),
	FOREIGN KEY (conf_id) REFERENCES Conference(conf_id) 
);
-- Table: Officer's_opinion_kris
CREATE TABLE Officers_opinion_kris ( 
	k_offic_id INTEGER PRIMARY KEY AUTO_INCREMENT, 
	kris_id INTEGER NOT NULL UNIQUE,
	research_admin ENUM('ถูกต้อง', 'ไม่ถูกต้อง', 'อื่น ๆ'),
    doc_submit_date DATE DEFAULT (CURRENT_DATE),
	FOREIGN KEY (kris_id) REFERENCES Research_KRIS(kris_id)
);
CREATE TABLE Budget (
	budget_id INT AUTO_INCREMENT PRIMARY KEY,
	type ENUM ('Conference', 'Page_Charge') NOT NULL,
	conf_id INTEGER,
	pageC_id INTEGER,
	budget_year INT NOT NULL, 
	total_amount DECIMAL(10,2) NOT NULL,
	num_expenses_approved DECIMAL(10,2) NOT NULL,
	total_amount_approved DECIMAL(10,2) NOT NULL,
	remaining_credit_limit DECIMAL(10,2) NOT NULL,
	money_confer DECIMAL(10,2) NOT NULL,
	total_remaining_credit_limit DECIMAL(10,2) NOT NULL,
    doc_submit_date DATE DEFAULT (CURRENT_DATE),
	FOREIGN KEY (conf_id) REFERENCES Conference(conf_id),
	FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id)
);

INSERT INTO Users (
    user_role, user_nameth, user_nameeng, user_email, user_signature,user_moneyPC,
    user_moneyCF, user_positionth, user_positioneng, user_startwork, user_year
) VALUES
('professor', 'โอฬาร วงศ์วิรัตน์', 'Olarn Wongwirat', 'olarn@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '1998-09-06', TIMESTAMPDIFF(YEAR, '1998-09-06', CURRENT_DATE)),
('professor', 'นพพร โชติกกำธร', 'Nopporn Chotikakamthorn', 'nopporn@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1996-03-19', TIMESTAMPDIFF(YEAR, '1996-03-19', CURRENT_DATE)),
('professor', 'อัครินทร์ คุณกิตติ', 'Akharin Khunkitti', 'akharin@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.', 'Asst. Prof.', '1989-03-01', TIMESTAMPDIFF(YEAR, '1989-03-01', CURRENT_DATE)),
('professor', 'วรพจน์ กรีสุระเดช', 'Worapoj Kreesuradej', 'worapoj@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1997-01-30', TIMESTAMPDIFF(YEAR, '1997-01-30', CURRENT_DATE)),
('professor', 'อาริต  ธรรมโน', 'Arit Thammano', 'arit@it.kmitl.ac.th', NULL, 0, 80000, 'ศ.ดร.', 'Prof. Dr.', '1998-10-01', TIMESTAMPDIFF(YEAR, '1998-10-01', CURRENT_DATE)),
('professor', 'โชติพัชร์ ภรณวลัย', 'Chotipat Pornavalai', 'chotipat@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1999-01-20', TIMESTAMPDIFF(YEAR, '1999-01-20', CURRENT_DATE)),
('professor', 'ภัทรชัย ลลิตโรจน์วงศ์', 'Pattarachai Lalitrojwong', 'pattarachai@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '1999-07-01', TIMESTAMPDIFF(YEAR, '1999-07-01', CURRENT_DATE)),
('professor', 'วารุนี  บัววิรัตน์', 'Warune Buavirat', 'warune@it.kmitl.ac.th', NULL, 0, 80000, 'อาจารย์', 'Mrs.', '2001-11-01', TIMESTAMPDIFF(YEAR, '2001-11-01', CURRENT_DATE)),
('professor', 'พรฤดี  เนติโสภากุล', 'Ponrudee Netisopakul', 'ponrudee@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2002-08-01', TIMESTAMPDIFF(YEAR, '2002-08-01', CURRENT_DATE)),
('professor', 'พัฒนพงษ์  ฉันทมิตรโอภาส', 'Pattanapong Chantamit-O-Pas', 'pattanapong@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-08-01', TIMESTAMPDIFF(YEAR, '2003-08-01', CURRENT_DATE)),
('professor', 'สุเมธ  ประภาวัต', 'Sumet Prabhavat', 'sumet@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-10-01', TIMESTAMPDIFF(YEAR, '2003-10-01', CURRENT_DATE)),
('professor', 'อนันตพัฒน์  อนันตชัย', 'Anuntapat Anuntachai', 'anuntapat@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-10-01', TIMESTAMPDIFF(YEAR, '2003-10-01', CURRENT_DATE)),
('professor', 'บุญประเสริฐ  สุรักษ์รัตนสกุล', 'Boonprasert Surakratanasakul', 'boonprasert@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-10-01', TIMESTAMPDIFF(YEAR, '2003-10-01', CURRENT_DATE)),
('professor', 'ลภัส  ประดิษฐ์ทัศนีย์', 'Lapas Pradittasnee', 'lapas@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-10-16', TIMESTAMPDIFF(YEAR, '2003-10-16', CURRENT_DATE)),
('professor', 'สุพัณณดา  โชติพันธ์', 'Supannada Chotipant', 'supannada@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2005-05-02', TIMESTAMPDIFF(YEAR, '2005-05-02', CURRENT_DATE)),
('professor', 'สมเกียรติ  วังศิริพิทักษ์', 'Somkiat Wangsiripitak', 'somkiat@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '1998-04-27', TIMESTAMPDIFF(YEAR, '1998-04-27', CURRENT_DATE)),
('professor', 'สุขสันต์  พาณิชพาพิบูล', 'Sooksan Panichpapiboon', 'sooksan@it.kmitl.ac.th', NULL, 0, 80000, 'ศ.ดร.', 'Prof. Dr.', '2006-10-31', TIMESTAMPDIFF(YEAR, '2006-10-31', CURRENT_DATE)),
('professor', 'ปานวิทย์  ธุวะนุติ', 'Panwit Tuwanut', 'panwit@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2009-12-15', TIMESTAMPDIFF(YEAR, '2009-12-15', CURRENT_DATE)),
('professor', 'สุภวรรณ  ทัศนประเสริฐ', 'Supawan Tassanaprasert', 'supawan@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2010-03-02', TIMESTAMPDIFF(YEAR, '2010-03-02', CURRENT_DATE)),
('professor', 'กิติ์สุชาต  พสุภา', 'Kitsuchart Pasupa', 'kitsuchart@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2011-06-01', TIMESTAMPDIFF(YEAR, '2011-06-01', CURRENT_DATE)),
('professor', 'กันต์พงษ์  วรรัตน์ปัญญา', 'Kuntpong Woraratpanya', 'kuntpong@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2011-08-01', TIMESTAMPDIFF(YEAR, '2011-08-01', CURRENT_DATE)),
('professor', 'สุภกิจ  นุตยะสกุล', 'Supakit Nootyaskool', 'supakit@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2011-12-01', TIMESTAMPDIFF(YEAR, '2011-12-01', CURRENT_DATE)),
('professor', 'มานพ  พันธ์โคกกรวด', 'Manop Phankokkruad', 'manop@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2011-12-01', TIMESTAMPDIFF(YEAR, '2011-12-01', CURRENT_DATE)),
('professor', 'กนกวรรณ  อัจฉริยะชาญวณิช', 'Kanokwan Atchariyachanvanich', 'kanokwan@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2012-08-16', TIMESTAMPDIFF(YEAR, '2012-08-16', CURRENT_DATE)),
('professor', 'บัณฑิต  ฐานะโสภณ', 'Bundit Thanasopon', 'bundit@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2015-09-11', TIMESTAMPDIFF(YEAR, '2015-09-11', CURRENT_DATE)),
('professor', 'สิริอร  วิทยากร', 'Sirion Vittayakorn', 'sirion@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2017-01-16', TIMESTAMPDIFF(YEAR, '2017-01-16', CURRENT_DATE)),
('professor', 'พรสุรีย์  แจ่มศรี', 'Pornsuree Jamsri', 'pornsuree@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2017-02-01', TIMESTAMPDIFF(YEAR, '2017-02-01', CURRENT_DATE)),
('professor', 'สามารถ หมุดและ', 'Samart Moodleah', 'samart@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2017-02-20', TIMESTAMPDIFF(YEAR, '2017-02-20', CURRENT_DATE)),
('professor', 'ธราวิเชษฐ์  ธิติจรูญโรจน์', 'Taravichet Titijaroonroj', 'taravichet@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2019-06-03', TIMESTAMPDIFF(YEAR, '2019-06-03', CURRENT_DATE)),
('professor', 'นนท์  คนึงสุขเกษม', 'Nont Kanungsukkasem', 'nont@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2020-01-02', TIMESTAMPDIFF(YEAR, '2020-01-02', CURRENT_DATE)),
('professor', 'ประพันธ์  ปวรางกูร', 'Praphan Pavarangkoon', 'praphan@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2020-06-01', TIMESTAMPDIFF(YEAR, '2020-06-01', CURRENT_DATE)),
('professor', 'ศิรสิทธิ์  โล่ห์ชนะจิต', 'Sirasit Lochanachit', 'sirasit@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2020-09-01', TIMESTAMPDIFF(YEAR, '2020-09-01', CURRENT_DATE)),
('professor', 'ทัศนัย  พลอยสุวรรณ', 'Tuchsanai Ploysuwan', 'tuchsanai@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2022-06-01', TIMESTAMPDIFF(YEAR, '2022-06-01', CURRENT_DATE)),
('professor', 'ณัฏฐ์  ดิลกธนากุล', 'Nat Dilokthanakul', 'nat@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2022-07-01', TIMESTAMPDIFF(YEAR, '2022-07-01', CURRENT_DATE)),
('professor', 'สุวิทย์ ภูมิฤทธิกุล', 'Suvit Poomrittigul', 'suvit@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2022-12-01', TIMESTAMPDIFF(YEAR, '2022-12-01', CURRENT_DATE)),
('professor', 'ภัทรภร  วัฒนาชีพ', 'Bhattarabhorn Wattanacheep', 'Bhattarabhorn@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2023-09-01', TIMESTAMPDIFF(YEAR, '2023-09-01', CURRENT_DATE)),
('professor', 'อิสสระพงศ์  ค้วนเครือ', 'Issarapong Khuankrue', 'Issarapong@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2023-09-01', TIMESTAMPDIFF(YEAR, '2023-09-01', CURRENT_DATE)),
('professor', 'บุญเลิศ  วัจจะตรากุล', 'Boonlert Watjatrakul', 'boonlert@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2024-01-02', TIMESTAMPDIFF(YEAR, '2024-01-02', CURRENT_DATE)),
('professor', 'จันทร์บูรณ์  สถิตวิริยวงศ์', 'Chanboon Sathitwiriyawong', 'chanboon@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE)),

('admin', 'พีรณัฐ ทิพย์รักษ์', 'Chanboon Sathitwiriyawong', '64070075@kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE)),

('admin', 'ศศิกานต์ หลงกระจ่าง', 'Chanboon Sathitwiriyawong', '64070105@kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE));


INSERT INTO Page_Charge (
    user_id, pageC_times, pageC_days, journal_name, quality_journal, 
    pc_isi_year, pc_sjr_year, pc_scopus_year, impact_factor, sjr_score, 
    cite_score, support_limit, article_title, vol_journal, issue_journal, 
    month, year, ISSN_ISBN, submission_date, date_review_announce, final_date, 
    article_research_ject, research_type, research_type2, name_funding_source, 
    budget_limit, annual, presenter_type, request_support
   )VALUES
    (1, 2, STR_TO_DATE('01-02-2024', '%d-%m-%Y'), 'Journal of Science', '{"ISI": true, "Scopus": false}', 
    2023, 2023, 2023, 5, 3, 
    10, 5000, 'A Study on AI', 15, 2, 
    6, 2024, '1234-5678', STR_TO_DATE('15-01-2024', '%d-%m-%Y'), STR_TO_DATE('01-02-2024', '%d-%m-%Y'), 
    STR_TO_DATE('10-02-2024', '%d-%m-%Y'), 'Artificial Intelligence', 'วิจัยพื้นฐาน', 'Machine Learning', 
    'National Science Fund', 100000, 2024, 'First Author', 3000
    );