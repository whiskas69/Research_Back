USE ResearchAdministration;
-- ปิดการตรวจสอบ Foreign Key ก่อน
SET FOREIGN_KEY_CHECKS = 0;

-- ลบตารางตามลำดับที่เหมาะสม
DROP TABLE IF EXISTS Notification;
DROP TABLE IF EXISTS Budget;
DROP TABLE IF EXISTS officers_opinion_kris;
DROP TABLE IF EXISTS officers_opinion_conf;
DROP TABLE IF EXISTS officers_opinion_pc;
DROP TABLE IF EXISTS File_pdf;
DROP TABLE IF EXISTS Form;
DROP TABLE IF EXISTS Research_KRIS;
DROP TABLE IF EXISTS Page_Charge;
DROP TABLE IF EXISTS Score;
DROP TABLE IF EXISTS Conference;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS ConditionPC;
DROP TABLE IF EXISTS ConditionCF;

-- เปิดการตรวจสอบ Foreign Key กลับมา
SET FOREIGN_KEY_CHECKS = 1;

-- สร้างตาราง Users CHECK
CREATE TABLE Users (
	user_id INT PRIMARY KEY UNIQUE  AUTO_INCREMENT,
	user_role ENUM('professor', 'admin', 'hr', 'research', 'finance', 'associate', 'dean') NOT NULL,
	user_nameth VARCHAR(255) NOT NULL,
	user_nameeng VARCHAR(255) NOT NULL,
	user_email VARCHAR(255) NOT NULL,
	user_signature VARCHAR(255),
	user_moneyPC DECIMAL(10,2),
    user_moneyCF DECIMAL(10,2),
	user_positionth VARCHAR(255),
    user_positioneng VARCHAR(255),
    user_startwork DATE NOT NULL,
    user_year INT NOT NULL,
    user_confer boolean NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- ตารางเอกสารขออนุมัติค่าเดินทาง (Conference) CHECK
CREATE TABLE Conference (
    conf_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
    user_id INT NOT NULL,
    conf_times INT NOT NULL,
    conf_days DATE NOT NULL,
    trav_dateStart DATE NOT NULL,
    trav_dateEnd DATE NOT NULL,
    conf_research VARCHAR(255) NOT NULL,
    num_co_researchers INT,
    name_co_researchers JSON,
    course_co_researchers JSON,
    conf_name VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_venue VARCHAR(255) NOT NULL,
    date_submit_organizer DATE NOT NULL,
    argument_date_review DATE NOT NULL,
    last_day_register DATE NOT NULL,
    meeting_type ENUM('facultyHost', 'inScopus') NOT NULL,
    quality_meeting ENUM('standard', 'good', ''),
    presenter_type ENUM('First Author', 'Corresponding Author') NOT NULL,
    time_of_leave ENUM('1', '2'),
    location VARCHAR(255) NOT NULL,
    wos_2_leave ENUM('WoS-Q1', 'WoS-Q2'),
    name_2_leave VARCHAR(255),
    withdraw ENUM('50%', '100%'),
    wd_100_quality ENUM('WoS-Q1', 'WoS-Q2', 'WoS-Q3', 'SJR-Q1', 'SJR-Q2'),
    wd_name_100 VARCHAR(255),
    country_conf ENUM('abroad', 'domestic') NOT NULL,
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
ALTER TABLE Conference CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ตารางคำนวณคะแนนคุณภาพการประชุมวิชาการ (Score) CHECK
CREATE TABLE Score (
    sc_id INT PRIMARY KEY AUTO_INCREMENT,
    conf_id INT NOT NULL UNIQUE,
    score_type ENUM('SJR', 'CIF', 'CORE'),
    sjr_score DECIMAL(10,2),
    sjr_year INT,
    hindex_score DECIMAL(10,2),
    hindex_year INT,
    Citation DECIMAL(10,2),
    score_result DECIMAL(10,2),
    core_rank VARCHAR(255),
    FOREIGN KEY (conf_id) REFERENCES Conference(conf_id)
);
-- ตารางเอกสารขออนุมัติค่า Page Charge (Page_Charge) CHECK
CREATE TABLE Page_Charge (
    pageC_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
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
    qt_isi INT,
    qt_sjr INT,
    qt_scopus INT,
    support_limit INT NOT NULL,
    article_title VARCHAR(255) NOT NULL,
    num_co_researchers INT,
    name_co_researchers JSON,
    course_co_researchers JSON,
    vol_journal INT,
    issue_journal INT,
    month VARCHAR(255),
    year INT,
    ISSN_ISBN VARCHAR(255),
    submission_date DATE NOT NULL,
	date_review_announce DATE NOT NULL,
    final_date DATE NOT NULL,
    article_research_ject VARCHAR(255),
    research_type ENUM('basic', 'applied', 'research&development', 'other' ),
    research_type2 VARCHAR(255),
    name_funding_source VARCHAR(255),
    budget_limit DECIMAL(10,2),
    annual INT,
    presenter_type ENUM('First Author', 'Corresponding Author') NOT NULL,
    request_support DECIMAL(10,2) NOT NULL,
    doc_submit_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
ALTER TABLE Page_Charge CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Table for Research_KRIS CHECK
CREATE TABLE Research_KRIS (
	kris_id INT AUTO_INCREMENT PRIMARY KEY,
	user_id INT NOT NULL,
	name_research_th VARCHAR(255) NOT NULL,
	name_research_en VARCHAR(255) NOT NULL,
	research_cluster JSON NOT NULL,
	res_cluster_other VARCHAR(255),
	res_standard JSON NOT NULL,
	res_standard_trade ENUM('52', '53'),
	h_index DECIMAL(10,2) NOT NULL,
	his_invention Varchar (255) NOT NULL,
	participation_percent DECIMAL(10,2) NOT NULL,
    proposed_budget DECIMAL(10,2) NOT NULL,
	year INT NOT NULL,
	project_periodStart Date NOT NULL,
	project_periodEnd Date NOT NULL,
	doc_submit_date DATE DEFAULT (CURRENT_DATE),
	FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
ALTER TABLE Research_KRIS MODIFY COLUMN research_cluster JSON;
ALTER TABLE Research_KRIS MODIFY COLUMN res_standard JSON;
ALTER TABLE Research_KRIS MODIFY COLUMN res_standard_trade JSON;

-- สร้างตาราง Form CHECK
CREATE TABLE Form (
	form_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
	form_type ENUM('Conference', 'Page_Charge', 'Research_KRIS') NOT NULL,
	conf_id INT UNIQUE,
	pageC_id INT UNIQUE,
	kris_id INT UNIQUE,
	form_status ENUM('hr', 'research', 'finance', 'associate', 'dean','waitingApproval', 'approve', 'notApproved', 'attendMeeting') NOT NULL,
    edit_data JSON,
    date_form_edit DATE DEFAULT (CURRENT_DATE),
    editor VARCHAR(255),
    professor_reedit boolean,
	FOREIGN KEY (conf_id) REFERENCES Conference(conf_id),
	FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id),
	FOREIGN KEY (kris_id) REFERENCES Research_KRIS(kris_id)
);
ALTER TABLE Form CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ตารางเก็บเอกสาร PDF (File_pdf) CHECK
CREATE TABLE File_pdf (
	file_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
	type ENUM ('Conference', 'Page_Charge','Research_KRIS') NOT NULL,
	conf_id INT UNIQUE,
	pageC_id INT UNIQUE,
	kris_id INT UNIQUE,
	kris_file VARCHAR(255),
	full_page VARCHAR(255), -- confer
	date_published_journals VARCHAR(255),
	published_journals VARCHAR(255),
	q_proof VARCHAR(255),
	call_for_paper VARCHAR(255),
	fee_receipt VARCHAR(255),          
	fx_rate_document VARCHAR(255),
	conf_proof VARCHAR(255),
	pc_proof VARCHAR(255), -- pc
	q_pc_proof VARCHAR(255),
	invoice_public VARCHAR(255),
	accepted VARCHAR(255), -- confer && pc
	copy_article VARCHAR(255),
    upload_article VARCHAR(255),
	FOREIGN KEY (conf_id) REFERENCES Conference(conf_id),
	FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id),
	FOREIGN KEY (kris_id) REFERENCES Research_KRIS(kris_id)
);
-- Table for officer's_opinion_pc CHECK
CREATE TABLE officers_opinion_pc (
	p_office_id INT AUTO_INCREMENT PRIMARY KEY,
    research_id INT,
    associate_id INT,
    dean_id INT,
    pageC_id INT NOT NULL UNIQUE,
    p_research_admin ENUM('approve', 'waiting letter', 'other'),
    p_reason VARCHAR(255),
    p_deputy_dean ENUM('agree', 'disagree'),
    p_date_accepted_approve DATE, -- วันที่เอกสารได้รับการอนุมัติ
    p_acknowledge ENUM('acknowledge', 'notApproved'),
    p_approve_result ENUM('acknowledge', 'approve', 'notApproved', 'other'),
    p_reason_dean_approve VARCHAR(255),
    research_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    associate_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    dean_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (research_id) REFERENCES Users(user_id),
    FOREIGN KEY (associate_id) REFERENCES Users(user_id),
    FOREIGN KEY (dean_id) REFERENCES Users(user_id),
    FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id)
);
ALTER TABLE officers_opinion_pc CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Table: officer's_opinion_conf CHECK
CREATE TABLE officers_opinion_conf (
	c_office_id INT PRIMARY KEY AUTO_INCREMENT,
    hr_id INT,
    research_id INT,
    associate_id INT,
    dean_id INT,
	conf_id INT NOT NULL UNIQUE,
	c_research_hr ENUM('correct', 'notCorrect', 'other'),
	c_reason VARCHAR(255),
    c_noteOther VARCHAR(255),
	c_meet_quality ENUM('correct', 'notCorrect'),
	c_quality_reason VARCHAR(255),
	c_deputy_dean ENUM('agree', 'Disagree'),
	c_approve_result ENUM('acknowledge', 'notApproved'),
    hr_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    research_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    associate_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    dean_doc_submit_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (hr_id) REFERENCES Users(user_id),
    FOREIGN KEY (research_id) REFERENCES Users(user_id),
    FOREIGN KEY (associate_id) REFERENCES Users(user_id),
    FOREIGN KEY (dean_id) REFERENCES Users(user_id),
	FOREIGN KEY (conf_id) REFERENCES Conference(conf_id)
);
ALTER TABLE officers_opinion_conf CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Table: officer's_opinion_kris CHECK
CREATE TABLE officers_opinion_kris (
	k_office_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
	kris_id INT NOT NULL UNIQUE,
	research_admin ENUM('acknowledge', 'notAcknowledge'),
    doc_submit_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
	FOREIGN KEY (kris_id) REFERENCES Research_KRIS(kris_id)
);
ALTER TABLE officers_opinion_kris CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Table: Budget CHECK
CREATE TABLE Budget (
	budget_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
	form_id INT NOT NULL UNIQUE,
	budget_year INT NOT NULL,
	Page_Charge_amount DECIMAL(10,2),
    Conference_amount DECIMAL(10,2),
	num_expenses_approved INT NOT NULL,
	total_amount_approved DECIMAL(10,2) NOT NULL,
	remaining_credit_limit DECIMAL(10,2) NOT NULL,
	amount_approval DECIMAL(10,2) NOT NULL,
	total_remaining_credit_limit DECIMAL(10,2) NOT NULL,
    doc_submit_date DATE,
    travelExpenses DECIMAL(10,2),
    allowance DECIMAL(10,2),
    withdraw DECIMAL(10,2),
	FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (form_id) REFERENCES Form(form_id)
);
CREATE TABLE Notification (
	noti_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    form_id INT UNIQUE NOT NULL,
    name_form VARCHAR(255) NOT NULL,
    date_update DATE DEFAULT (CURRENT_DATE),
	FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (form_id) REFERENCES Form(form_id)
);
CREATE TABLE ConditionPC (
    condition_id INT AUTO_INCREMENT PRIMARY KEY,
    natureAmount DECIMAL(10,2),
    mdpiQuartile1 DECIMAL(10,2),
    mdpiQuartile2 DECIMAL(10,2),
    otherQuartile1 DECIMAL(10,2),
    otherQuartile2 DECIMAL(10,2),
    otherQuartile3 DECIMAL(10,2),
    otherQuartile4 DECIMAL(10,2),
    date_update DATE DEFAULT (CURRENT_DATE)
);
CREATE TABLE ConditionCF (
    condition_id INT AUTO_INCREMENT PRIMARY KEY,
    maxLeaveinThai DECIMAL(10,2),
    maxLeaveoutThai DECIMAL(10,2),
    workTimeYears DECIMAL(10,2),
    journalYears DECIMAL(10,2),
    qualityScoreSJR DECIMAL(10,2),
    qualityScoreCIF DECIMAL(10,2),
    qualityScoreCORE VARCHAR(10),
    expense100ASEAN DECIMAL(10,2),
    expense100Asia DECIMAL(10,2),
    expense100EuropeAmericaAustraliaAfrica DECIMAL(10,2),
    expense50ASEAN DECIMAL(10,2),
    expense50Asia DECIMAL(10,2),
    expense50EuropeAmericaAustraliaAfrica DECIMAL(10,2),
    date_update DATE DEFAULT (CURRENT_DATE)
);

INSERT INTO Users (
    user_role, user_nameth, user_nameeng, user_email, user_signature,user_moneyPC,
    user_moneyCF, user_positionth, user_positioneng, user_startwork, user_year, user_confer
) VALUES
('associate', 'โอฬาร วงศ์วิรัตน์', 'Olarn Wongwirat', 'olarn@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '1998-09-06', TIMESTAMPDIFF(YEAR, '1998-09-06', CURRENT_DATE), true),
('professor', 'นพพร โชติกกำธร', 'Nopporn Chotikakamthorn', 'nopporn@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1996-03-19', TIMESTAMPDIFF(YEAR, '1996-03-19', CURRENT_DATE), true),
('professor', 'อัครินทร์ คุณกิตติ', 'Akharin Khunkitti', 'akharin@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.', 'Asst. Prof.', '1989-03-01', TIMESTAMPDIFF(YEAR, '1989-03-01', CURRENT_DATE), true),
('dean', 'วรพจน์ กรีสุระเดช', 'Worapoj Kreesuradej', 'worapoj@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1997-01-30', TIMESTAMPDIFF(YEAR, '1997-01-30', CURRENT_DATE), true),
('professor', 'อาริต  ธรรมโน', 'Arit Thammano', 'arit@it.kmitl.ac.th', NULL, 0, 80000, 'ศ.ดร.', 'Prof. Dr.', '1998-10-01', TIMESTAMPDIFF(YEAR, '1998-10-01', CURRENT_DATE), true),
('professor', 'โชติพัชร์ ภรณวลัย', 'Chotipat Pornavalai', 'chotipat@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1999-01-20', TIMESTAMPDIFF(YEAR, '1999-01-20', CURRENT_DATE), true),
('professor', 'ภัทรชัย ลลิตโรจน์วงศ์', 'Pattarachai Lalitrojwong', 'pattarachai@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '1999-07-01', TIMESTAMPDIFF(YEAR, '1999-07-01', CURRENT_DATE), true),
('professor', 'วารุนี  บัววิรัตน์', 'Warune Buavirat', 'warune@it.kmitl.ac.th', NULL, 0, 80000, 'อาจารย์', 'Mrs.', '2001-11-01', TIMESTAMPDIFF(YEAR, '2001-11-01', CURRENT_DATE), true),
('professor', 'พรฤดี  เนติโสภากุล', 'Ponrudee Netisopakul', 'ponrudee@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2002-08-01', TIMESTAMPDIFF(YEAR, '2002-08-01', CURRENT_DATE), true),
('professor', 'พัฒนพงษ์  ฉันทมิตรโอภาส', 'Pattanapong Chantamit-O-Pas', 'pattanapong@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-08-01', TIMESTAMPDIFF(YEAR, '2003-08-01', CURRENT_DATE), true),
('professor', 'สุเมธ  ประภาวัต', 'Sumet Prabhavat', 'sumet@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-10-01', TIMESTAMPDIFF(YEAR, '2003-10-01', CURRENT_DATE), true),
('professor', 'อนันตพัฒน์  อนันตชัย', 'Anuntapat Anuntachai', 'anuntapat@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-10-01', TIMESTAMPDIFF(YEAR, '2003-10-01', CURRENT_DATE), true),
('associate', 'บุญประเสริฐ  สุรักษ์รัตนสกุล', 'Boonprasert Surakratanasakul', 'boonprasert@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-10-01', TIMESTAMPDIFF(YEAR, '2003-10-01', CURRENT_DATE), true),
('professor', 'ลภัส  ประดิษฐ์ทัศนีย์', 'Lapas Pradittasnee', 'lapas@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2003-10-16', TIMESTAMPDIFF(YEAR, '2003-10-16', CURRENT_DATE), true),
('professor', 'สุพัณณดา  โชติพันธ์', 'Supannada Chotipant', 'supannada@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2005-05-02', TIMESTAMPDIFF(YEAR, '2005-05-02', CURRENT_DATE), true),
('professor', 'สมเกียรติ  วังศิริพิทักษ์', 'Somkiat Wangsiripitak', 'somkiat@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '1998-04-27', TIMESTAMPDIFF(YEAR, '1998-04-27', CURRENT_DATE), true),
('professor', 'สุขสันต์  พาณิชพาพิบูล', 'Sooksan Panichpapiboon', 'sooksan@it.kmitl.ac.th', NULL, 0, 80000, 'ศ.ดร.', 'Prof. Dr.', '2006-10-31', TIMESTAMPDIFF(YEAR, '2006-10-31', CURRENT_DATE), true),
('professor', 'ปานวิทย์  ธุวะนุติ', 'Panwit Tuwanut', 'panwit@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2009-12-15', TIMESTAMPDIFF(YEAR, '2009-12-15', CURRENT_DATE), true),
('professor', 'สุภวรรณ  ทัศนประเสริฐ', 'Supawan Tassanaprasert', 'supawan@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2010-03-02', TIMESTAMPDIFF(YEAR, '2010-03-02', CURRENT_DATE), true),
('associate', 'กิติ์สุชาต  พสุภา', 'Kitsuchart Pasupa', 'kitsuchart@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2011-06-01', TIMESTAMPDIFF(YEAR, '2011-06-01', CURRENT_DATE), true),
('associate', 'กันต์พงษ์  วรรัตน์ปัญญา', 'Kuntpong Woraratpanya', 'kuntpong@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2011-08-01', TIMESTAMPDIFF(YEAR, '2011-08-01', CURRENT_DATE), true),
('professor', 'สุภกิจ  นุตยะสกุล', 'Supakit Nootyaskool', 'supakit@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2011-12-01', TIMESTAMPDIFF(YEAR, '2011-12-01', CURRENT_DATE), true),
('professor', 'มานพ  พันธ์โคกกรวด', 'Manop Phankokkruad', 'manop@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2011-12-01', TIMESTAMPDIFF(YEAR, '2011-12-01', CURRENT_DATE), true),
('professor', 'กนกวรรณ  อัจฉริยะชาญวณิช', 'Kanokwan Atchariyachanvanich', 'kanokwan@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2012-08-16', TIMESTAMPDIFF(YEAR, '2012-08-16', CURRENT_DATE), true),
('professor', 'บัณฑิต  ฐานะโสภณ', 'Bundit Thanasopon', 'bundit@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2015-09-11', TIMESTAMPDIFF(YEAR, '2015-09-11', CURRENT_DATE), true),
('professor', 'สิริอร  วิทยากร', 'Sirion Vittayakorn', 'sirion@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2017-01-16', TIMESTAMPDIFF(YEAR, '2017-01-16', CURRENT_DATE), true),
('professor', 'พรสุรีย์  แจ่มศรี', 'Pornsuree Jamsri', 'pornsuree@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2017-02-01', TIMESTAMPDIFF(YEAR, '2017-02-01', CURRENT_DATE), true),
('professor', 'สามารถ หมุดและ', 'Samart Moodleah', 'samart@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2017-02-20', TIMESTAMPDIFF(YEAR, '2017-02-20', CURRENT_DATE), true),
('professor', 'ธราวิเชษฐ์  ธิติจรูญโรจน์', 'Taravichet Titijaroonroj', 'taravichet@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2019-06-03', TIMESTAMPDIFF(YEAR, '2019-06-03', CURRENT_DATE), true),
('professor', 'นนท์  คนึงสุขเกษม', 'Nont Kanungsukkasem', 'nont@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2020-01-02', TIMESTAMPDIFF(YEAR, '2020-01-02', CURRENT_DATE), true),
('professor', 'ประพันธ์  ปวรางกูร', 'Praphan Pavarangkoon', 'praphan@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2020-06-01', TIMESTAMPDIFF(YEAR, '2020-06-01', CURRENT_DATE), true),
('professor', 'ศิรสิทธิ์  โล่ห์ชนะจิต', 'Sirasit Lochanachit', 'sirasit@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2020-09-01', TIMESTAMPDIFF(YEAR, '2020-09-01', CURRENT_DATE), true),
('professor', 'ทัศนัย  พลอยสุวรรณ', 'Tuchsanai Ploysuwan', 'tuchsanai@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2022-06-01', TIMESTAMPDIFF(YEAR, '2022-06-01', CURRENT_DATE), false),
('professor', 'ณัฏฐ์  ดิลกธนากุล', 'Nat Dilokthanakul', 'nat@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2022-07-01', TIMESTAMPDIFF(YEAR, '2022-07-01', CURRENT_DATE), false),
('professor', 'สุวิทย์ ภูมิฤทธิกุล', 'Suvit Poomrittigul', 'suvit@it.kmitl.ac.th', NULL, 0, 80000, 'ผศ.ดร.', 'Asst. Prof. Dr.', '2022-12-01', TIMESTAMPDIFF(YEAR, '2022-12-01', CURRENT_DATE), false),
('professor', 'ภัทรภร  วัฒนาชีพ', 'Bhattarabhorn Wattanacheep', 'Bhattarabhorn@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2023-09-01', TIMESTAMPDIFF(YEAR, '2023-09-01', CURRENT_DATE), false),
('professor', 'อิสสระพงศ์  ค้วนเครือ', 'Issarapong Khuankrue', 'Issarapong@it.kmitl.ac.th', NULL, 0, 80000, 'ดร.', 'Dr.', '2023-09-01', TIMESTAMPDIFF(YEAR, '2023-09-01', CURRENT_DATE), false),
('professor', 'บุญเลิศ  วัจจะตรากุล', 'Boonlert Watjatrakul', 'boonlert@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2024-01-02', TIMESTAMPDIFF(YEAR, '2024-01-02', CURRENT_DATE), false),
('professor', 'จันทร์บูรณ์  สถิตวิริยวงศ์', 'Chanboon Sathitwiriyawong', 'chanboon@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), true),

('research', 'รัตนา วรผลึก', 'Rattana Wolrapaluk', 'rattana@it.kmitl.ac.th', NULL, 0, 80000, '', '', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), false),
('hr', 'วิภาดา ศิลา', 'Vipada Sila', 'vipada@it.kmitl.ac.th', NULL, 0, 80000, '', '', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), false),
('finance', 'พิจิตรา สุวรรณศรี', 'Pichitra Suwansri', 'pichitra@it.kmitl.ac.th', NULL, 0, 80000, '', '', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), false),
('admin', 'ศิริกุล อรุณรุ่งเรือง', 'Sirikun Arunrungrueang', 'sirikun@it.kmitl.ac.th', NULL, 0, 80000, '', '', '1996-08-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), false),

('associate', 'พีรณัฐ ทิพย์รักษ์', 'Peeranut Thiprak', '64070075@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2024-10-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), true),
('hr', 'ศศิกานต์ หลงกระจ่าง', 'Sasikan Longkachang', '64070105@it.kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2000-09-13', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), true),
('admin', 'admin', 'admin', '64070075@kmitl.ac.th', NULL, 0, 80000, 'รศ.ดร.', 'Assoc. Prof. Dr.', '2011-08-25', TIMESTAMPDIFF(YEAR, '1996-08-13', CURRENT_DATE), true);

INSERT INTO ConditionPC (
    condition_id, natureAmount, mdpiQuartile1, mdpiQuartile2, otherQuartile1, otherQuartile2, otherQuartile3, otherQuartile4
) VALUES
(1, 70000, 60000, 40000, 60000, 40000, 30000, 20000);

INSERT INTO ConditionCF (
    condition_id, maxLeaveinThai, maxLeaveoutThai, workTimeYears, journalYears, qualityScoreSJR, qualityScoreCIF, qualityScoreCORE,
    expense100ASEAN, expense100Asia, expense100EuropeAmericaAustraliaAfrica,
    expense50ASEAN, expense50Asia, expense50EuropeAmericaAustraliaAfrica
) VALUES
(1, 1, 2, 3, 2, 4, 9.38, 'A', 20000, 40000, 60000, 10000, 20000, 30000);

UPDATE Users
SET user_nameth = CONVERT(CAST(CONVERT(user_nameth USING latin1) AS BINARY) USING utf8mb4);
UPDATE Users
SET user_positionth = CONVERT(CAST(CONVERT(user_positionth USING latin1) AS BINARY) USING utf8mb4);