-- สร้างตาราง Users 
CREATE TABLE Users ( 
    user_id Integer PRIMARY KEY UNIQUE,
    user_role ENUM('professor', 'admin', 'insector', 'approver') NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL, 
    user_signature VARCHAR(255) NOT NULL ,
    user_money Integer NOT NULL ,
    user_position VARCHAR(255) NOT NULL
);

-- ตารางเอกสารขออนุมัติค่าเดินทาง (Conference)
CREATE TABLE Conference (
    conf_id INTEGER PRIMARY KEY AUTO_INCREMENT UNIQUE,
    user_id INTEGER NOT NULL,
    conf_times INT NOT NULL,
    conf_days DATE NOT NULL,
    trav_date DATE NOT NULL,
    conf_research VARCHAR(255) NOT NULL,
    conf_name VARCHAR(255) NOT NULL,
    date_of_conf DATE NOT NULL,
    meeting_venue VARCHAR(255) NOT NULL,
    dat_article_submission DATE NOT NULL,
    date_announce_article DATE NOT NULL,
    last_day_register DATE NOT NULL,
    meeting_type ENUM('คณะจัด ไม่อยู่scopus', 'อยู่ในscopus') NOT NULL,
    quality_meeting ENUM('มาตรฐาน', 'ดีมาก') NOT NULL,
    presenter_type ENUM('First Author', 'Corresponding Author') NOT NULL,
    time_of_leave ENUM('1', '2') NOT NULL,
    wos_2_leave ENUM('WoS-Q1', 'WoS-Q2'),
    name_2_leave VARCHAR(255),
    withdraw ENUM('50%', '100%'),
    wd_100_quality ENUM('WoS-Q1', 'WoS-Q2', 'WoS-Q3', 'SJR-Q1', 'SJR-Q2'),
    wd_name_100 VARCHAR(255),
    country_conf ENUM('ณ ต่างประเทศ', 'ภายในประเทศ') NOT NULL,
    num_register_articles INT NOT NULL,
    regist_amount_1_article INT NOT NULL,
    total_amount INT NOT NULL,
    domestic_expenses INT,
    overseas_expenses INT,
    travel_country VARCHAR(255),
    inter_expenses INT,
    airplane_tax INT,
    num_days_room INT,
    room_cost_per_night INT,
    total_room INT,
    num_travel_days INT,
    daily_allowance INT,
    total_allowance INT,
    all_money INT NOT NULL,
    user_signature VARCHAR(255) NOT NULL,
    doc_submission_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- ตารางคำนวณคะแนนคุณภาพการประชุมวิชาการ (Score)
CREATE TABLE Score (
    sc_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    conf_id INTEGER NOT NULL UNIQUE,
    score_formular ENUM('SJR', 'CIF', 'CORE') NOT NULL,
    sjr_score INT,
    sjr_year INT,
    hindex_score INT,
    hindex_year INT,
    score_result INT,
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
    quality_journal ENUM('SJR', 'ISI', 'Scopus', 'Nature') NOT NULL,
    pc_isi_year INT,
    pc_sjr_year INT,
    pc_scopus_year INT,
    impact_factor INT,
    sjr_score INT,
    cite_score INT,
    support_limit INT NOT NULL,
    article_title VARCHAR(255) NOT NULL,
    vol_journal INT NOT NULL,
    issue_journal INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    ISSN_ISBN VARCHAR(255) NOT NULL,
    Submission_date DATE NOT NULL,
	date_review_announce DATE NOT NULL,
    final_date DATE NOT NULL,
    article_research_ject VARCHAR(255) NOT NULL,
    research_type ENUM('วิจัยพื้นฐาน', 'วิจัยประยุกต์', 'วิจัยและพัฒนา', 'อื่นๆ' ) NOT NULL,
    research_type2 VARCHAR(255),
    name_funding_source VARCHAR(255) NOT NULL,
    budget_limit INT NOT NULL,
    annual INT NOT NULL,
    presenter_type ENUM('First Author', 'Corresponding Author') NOT NULL,
    request_support INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- Table for Research_KRIS 
CREATE TABLE Research_KRIS ( 
    kris_id INT AUTO_INCREMENT PRIMARY KEY, 
    user_id INTEGER NOT NULL, 
    name_research_th VARCHAR(255) NOT NULL,
    name_research_en VARCHAR(255) NOT NULL,
    research_cluster ENUM ('ICT_R&A','ICT_S&I', 'Battery&EV', 'Renewable Energy', 'Biomedical', 'Agriculture& Food', 'Future Mobility & Logistic', 'Materials', 'Creative Economy','other') NOT NULL,
    res_cluster_other VARCHAR(255),
    res_standard ENUM ('ใช้สัตว์ทดลอง', 'วิจัยในมนุษย์', 'วิจัยด้านเทคโนโลยีชีวภาพสมัยใหม่หรือพันธุวิศวกรรม', 'ใช้พันธุ์พืช')  NOT NULL,
    res_standard_plants ENUM ('52', '53'),
    h_index Integer NOT NULL,
    project_period Date NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) 
);

-- สร้างตาราง Form 
CREATE TABLE Form ( 
    form_id INTEGER PRIMARY KEY AUTO_INCREMENT UNIQUE, 
    form_type ENUM('Conference', 'Page_Charge', 'Research_KRIS') NOT NULL, 
    conf_id INTEGER, 
    pageC_id INTEGER,
    kris_id INTEGER,
    form_status ENUM('ตรวจสอบ','ฝ่ายบริหารทรัพยากรบุคคล','ฝ่ายบริหารงานวิจัย',  'ฝ่ายบริหารการเงิน', 'รองคณบดี', 'คณบดี','รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ') NOT NULL, 
    form_money INTEGER NOT NULL, 
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
    full_page VARCHAR(255),
    ac_for_claim VARCHAR(255),
    q_proof VARCHAR(255),
    call_for_paper VARCHAR(255),
    fee_receipt VARCHAR(255),
    fx_rate_document VARCHAR(255),
    conf_proof VARCHAR(255),
    Pc_proof VARCHAR(255),
    q_pc_proof VARCHAR(255),
    Invoice VARCHAR(255),
    accepted VARCHAR(255),
    FOREIGN KEY (conf_id) REFERENCES Conference(conf_id), 
    FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id), 
    FOREIGN KEY (kris_id) REFERENCES Research_KRIS(kris_id)
);
-- Table for Officer's_opinion_pc
CREATE TABLE Officers_opinion_pc ( 
    p_offic_id INT AUTO_INCREMENT PRIMARY KEY, 
    pageC_id INTEGER NOT NULL UNIQUE, 
    p_research_admin ENUM('อนุมัติ', 'ไม่อนุมัติ', 'อื่น ๆ') NOT NULL, 
    p_reason VARCHAR(255) NOT NULL, 
    p_deputy_dean VARCHAR(255) NOT NULL, 
    p_date_dean_approve DATE NOT NULL, 
    p_approve_result ENUM('อนุมัติ', 'ไม่อนุมัติ', 'อื่น ๆ') NOT NULL,
    FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id)
);


-- Table: Officer's_opinion_conf
CREATE TABLE Officers_opinion_conf ( 
    c_offic_id INTEGER PRIMARY KEY AUTO_INCREMENT, 
    conf_id INTEGER NOT NULL UNIQUE,
    c_research_admin ENUM('ถูกต้อง', 'ไม่ถูกต้อง', 'อื่น ๆ') NOT NULL, 
    c_reason VARCHAR(255) NOT NULL, 
    c_meet_quality ENUM('มาตรฐาน', 'ดีมาก') NOT NULL, 
    c_good_reason VARCHAR(255) NOT NULL, 
    c_deputy_dean VARCHAR(255) NOT NULL, 
    c_approve_result ENUM('อนุมัติ', 'ไม่อนุมัติ', 'อื่น ๆ') NOT NULL, 
    FOREIGN KEY (conf_id) REFERENCES Conference(conf_id) 
);

CREATE TABLE Budget (
    budget_id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM ('Conference', 'Page_Charge') NOT NULL,
    conf_id INTEGER,
    pageC_id INTEGER,
    budget_year INT NOT NULL, 
    total_amount INT NOT NULL,
    num_expenses_approved INT NOT NULL,
    total_amount_approved INT NOT NULL,
    remaining_credit_limit INT NOT NULL,
    money_confer INT NOT NULL,
    total_remaining_credit_limit INT NOT NULL,
    FOREIGN KEY (conf_id) REFERENCES Conference(conf_id),
    FOREIGN KEY (pageC_id) REFERENCES Page_Charge(pageC_id)
);
