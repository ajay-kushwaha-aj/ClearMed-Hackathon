import { PrismaClient, HospitalType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ClearMed database with merged expanded data...');

  // ─── TREATMENTS ───────────────────────────────────────────────────────────
  const treatments = await Promise.all([
    // ORIGINAL ORTHOPAEDICS
    prisma.treatment.upsert({ where: { slug: 'knee-replacement' }, update: {}, create: { name: 'Knee Replacement Surgery', slug: 'knee-replacement', category: 'Orthopaedics', specialization: 'Orthopaedic Surgeon', icdCode: 'M17', description: 'Total or partial knee replacement for severe arthritis or injury', avgDuration: 5 } }),
    prisma.treatment.upsert({ where: { slug: 'hip-replacement' }, update: {}, create: { name: 'Hip Replacement Surgery', slug: 'hip-replacement', category: 'Orthopaedics', specialization: 'Orthopaedic Surgeon', icdCode: 'M16', description: 'Total hip replacement for arthritis or femoral fracture', avgDuration: 6 } }),
    prisma.treatment.upsert({ where: { slug: 'acl-reconstruction' }, update: {}, create: { name: 'ACL Reconstruction', slug: 'acl-reconstruction', category: 'Orthopaedics', specialization: 'Orthopaedic Surgeon', icdCode: 'S83', description: 'Anterior cruciate ligament reconstruction surgery', avgDuration: 3 } }),
    prisma.treatment.upsert({ where: { slug: 'spinal-fusion' }, update: {}, create: { name: 'Spinal Fusion Surgery', slug: 'spinal-fusion', category: 'Orthopaedics', specialization: 'Spine Surgeon', icdCode: 'M47', description: 'Vertebral fusion for degenerative disc disease or spondylolisthesis', avgDuration: 7 } }),
    prisma.treatment.upsert({ where: { slug: 'shoulder-replacement' }, update: {}, create: { name: 'Shoulder Replacement', slug: 'shoulder-replacement', category: 'Orthopaedics', specialization: 'Orthopaedic Surgeon', icdCode: 'M19', description: 'Total shoulder joint replacement', avgDuration: 4 } }),

    // ORIGINAL CARDIOLOGY
    prisma.treatment.upsert({ where: { slug: 'angioplasty' }, update: {}, create: { name: 'Coronary Angioplasty (PTCA)', slug: 'angioplasty', category: 'Cardiology', specialization: 'Interventional Cardiologist', icdCode: 'I25', description: 'Percutaneous transluminal coronary angioplasty with stenting', avgDuration: 3 } }),
    prisma.treatment.upsert({ where: { slug: 'bypass-surgery' }, update: {}, create: { name: 'Bypass Surgery (CABG)', slug: 'bypass-surgery', category: 'Cardiology', specialization: 'Cardiac Surgeon', icdCode: 'Z95', description: 'Coronary artery bypass grafting surgery', avgDuration: 10 } }),
    prisma.treatment.upsert({ where: { slug: 'pacemaker-implant' }, update: {}, create: { name: 'Pacemaker Implantation', slug: 'pacemaker-implant', category: 'Cardiology', specialization: 'Electrophysiologist', icdCode: 'I44', description: 'Permanent cardiac pacemaker device implantation', avgDuration: 4 } }),
    prisma.treatment.upsert({ where: { slug: 'echocardiography' }, update: {}, create: { name: 'Echocardiography', slug: 'echocardiography', category: 'Cardiology', specialization: 'Cardiologist', icdCode: 'I51', description: 'Cardiac ultrasound for structural and functional heart assessment', avgDuration: 1 } }),
    prisma.treatment.upsert({ where: { slug: 'valve-replacement' }, update: {}, create: { name: 'Heart Valve Replacement', slug: 'valve-replacement', category: 'Cardiology', specialization: 'Cardiac Surgeon', icdCode: 'I05', description: 'Surgical replacement of diseased heart valves', avgDuration: 8 } }),

    // ORIGINAL UROLOGY
    prisma.treatment.upsert({ where: { slug: 'kidney-stone-removal' }, update: {}, create: { name: 'Kidney Stone Removal (PCNL)', slug: 'kidney-stone-removal', category: 'Urology', specialization: 'Urologist', icdCode: 'N20', description: 'Percutaneous nephrolithotomy for large kidney stones', avgDuration: 4 } }),
    prisma.treatment.upsert({ where: { slug: 'ursl' }, update: {}, create: { name: 'Ureteroscopy (URSL)', slug: 'ursl', category: 'Urology', specialization: 'Urologist', icdCode: 'N20', description: 'Ureteroscopic laser lithotripsy for ureteric stones', avgDuration: 2 } }),
    prisma.treatment.upsert({ where: { slug: 'prostate-surgery' }, update: {}, create: { name: 'Prostate Surgery (TURP)', slug: 'prostate-surgery', category: 'Urology', specialization: 'Urologist', icdCode: 'N40', description: 'Transurethral resection of the prostate for BPH', avgDuration: 4 } }),
    prisma.treatment.upsert({ where: { slug: 'dialysis' }, update: {}, create: { name: 'Hemodialysis (Per Session)', slug: 'dialysis', category: 'Urology', specialization: 'Nephrologist', icdCode: 'Z49', description: 'Blood filtration for kidney failure patients', avgDuration: 1 } }),

    // ORIGINAL NEUROLOGY
    prisma.treatment.upsert({ where: { slug: 'brain-tumor-surgery' }, update: {}, create: { name: 'Brain Tumor Surgery', slug: 'brain-tumor-surgery', category: 'Neurosurgery', specialization: 'Neurosurgeon', icdCode: 'C71', description: 'Craniotomy for resection of brain tumour', avgDuration: 14 } }),
    prisma.treatment.upsert({ where: { slug: 'epilepsy-surgery' }, update: {}, create: { name: 'Epilepsy Surgery', slug: 'epilepsy-surgery', category: 'Neurosurgery', specialization: 'Neurosurgeon', icdCode: 'G40', description: 'Surgical treatment for drug-resistant epilepsy', avgDuration: 10 } }),

    // GENERAL SURGERY & GASTROENTEROLOGY
    prisma.treatment.upsert({ where: { slug: 'appendectomy' }, update: {}, create: { name: 'Appendectomy (Laparoscopic)', slug: 'appendectomy', category: 'General Surgery', specialization: 'General Surgeon', icdCode: 'K35', description: 'Laparoscopic removal of inflamed appendix', avgDuration: 2 } }),
    prisma.treatment.upsert({ where: { slug: 'hernia-repair' }, update: {}, create: { name: 'Hernia Repair (Laparoscopic)', slug: 'hernia-repair', category: 'General Surgery', specialization: 'General Surgeon', icdCode: 'K40', description: 'Laparoscopic inguinal or umbilical hernia mesh repair', avgDuration: 2 } }),
    prisma.treatment.upsert({ where: { slug: 'gallbladder-removal' }, update: {}, create: { name: 'Gallbladder Removal (Cholecystectomy)', slug: 'gallbladder-removal', category: 'General Surgery', specialization: 'General Surgeon', icdCode: 'K80', description: 'Laparoscopic cholecystectomy for gallstones', avgDuration: 2 } }),
    prisma.treatment.upsert({ where: { slug: 'colonoscopy' }, update: {}, create: { name: 'Colonoscopy', slug: 'colonoscopy', category: 'Gastroenterology', specialization: 'Gastroenterologist', icdCode: 'K63', description: 'Diagnostic and therapeutic colonoscopy', avgDuration: 1 } }),
    prisma.treatment.upsert({ where: { slug: 'endoscopy' }, update: {}, create: { name: 'Diagnostic Endoscopy', slug: 'endoscopy', category: 'Gastroenterology', specialization: 'Gastroenterologist', icdCode: 'K29', description: 'Upper GI tract diagnostic procedure', avgDuration: 1 } }),
    prisma.treatment.upsert({ where: { slug: 'bariatric-surgery' }, update: {}, create: { name: 'Bariatric Gastric Bypass', slug: 'bariatric-surgery', category: 'Bariatric Surgery', specialization: 'Bariatric Surgeon', icdCode: 'E66', description: 'Weight loss surgery for severe obesity', avgDuration: 4 } }),

    // INFECTIOUS DISEASES & MEDICINE (NEW)
    prisma.treatment.upsert({ where: { slug: 'dengue-treatment' }, update: {}, create: { name: 'Dengue Fever Management', slug: 'dengue-treatment', category: 'Internal Medicine', specialization: 'General Physician', icdCode: 'A90', description: 'Inpatient care and fluid management for severe Dengue', avgDuration: 5 } }),
    prisma.treatment.upsert({ where: { slug: 'malaria-treatment' }, update: {}, create: { name: 'Malaria Treatment', slug: 'malaria-treatment', category: 'Internal Medicine', specialization: 'General Physician', icdCode: 'B50', description: 'Inpatient management of complicated Malaria', avgDuration: 4 } }),
    prisma.treatment.upsert({ where: { slug: 'asthma-management' }, update: {}, create: { name: 'Severe Asthma Care', slug: 'asthma-management', category: 'Pulmonology', specialization: 'Pulmonologist', icdCode: 'J45', description: 'Acute exacerbation management for Asthma', avgDuration: 3 } }),
    prisma.treatment.upsert({ where: { slug: 'diabetes-management' }, update: {}, create: { name: 'Diabetic Ketoacidosis (DKA) Care', slug: 'diabetes-management', category: 'Endocrinology', specialization: 'Endocrinologist', icdCode: 'E10', description: 'Emergency management of severe diabetes complications', avgDuration: 4 } }),
    prisma.treatment.upsert({ where: { slug: 'thyroidectomy' }, update: {}, create: { name: 'Thyroidectomy', slug: 'thyroidectomy', category: 'Endocrinology', specialization: 'General Surgeon', icdCode: 'E04', description: 'Surgical removal of all or part of the thyroid gland', avgDuration: 2 } }),

    // ORIGINAL ONCOLOGY
    prisma.treatment.upsert({ where: { slug: 'chemotherapy' }, update: {}, create: { name: 'Chemotherapy (per cycle)', slug: 'chemotherapy', category: 'Oncology', specialization: 'Medical Oncologist', icdCode: 'Z51', description: 'Intravenous chemotherapy for cancer treatment', avgDuration: 2 } }),
    prisma.treatment.upsert({ where: { slug: 'radiation-therapy' }, update: {}, create: { name: 'Radiation Therapy (full course)', slug: 'radiation-therapy', category: 'Oncology', specialization: 'Radiation Oncologist', icdCode: 'Z51', description: 'External beam radiation therapy for cancer', avgDuration: 30 } }),
    prisma.treatment.upsert({ where: { slug: 'bone-marrow-transplant' }, update: {}, create: { name: 'Bone Marrow Transplant', slug: 'bone-marrow-transplant', category: 'Oncology', specialization: 'Haematologist', icdCode: 'Z94', description: 'Stem cell transplant for blood cancers', avgDuration: 30 } }),

    // ORIGINAL GYNAECOLOGY
    prisma.treatment.upsert({ where: { slug: 'caesarean-section' }, update: {}, create: { name: 'Caesarean Section (C-Section)', slug: 'caesarean-section', category: 'Gynaecology', specialization: 'Gynaecologist', icdCode: 'O82', description: 'Planned or emergency caesarean delivery', avgDuration: 4 } }),
    prisma.treatment.upsert({ where: { slug: 'normal-delivery' }, update: {}, create: { name: 'Normal Delivery', slug: 'normal-delivery', category: 'Gynaecology', specialization: 'Gynaecologist', icdCode: 'O80', description: 'Vaginal delivery without complications', avgDuration: 3 } }),
    prisma.treatment.upsert({ where: { slug: 'hysterectomy' }, update: {}, create: { name: 'Hysterectomy (Laparoscopic)', slug: 'hysterectomy', category: 'Gynaecology', specialization: 'Gynaecologist', icdCode: 'N80', description: 'Laparoscopic removal of uterus for fibroids or cancer', avgDuration: 5 } }),
    prisma.treatment.upsert({ where: { slug: 'ivf-treatment' }, update: {}, create: { name: 'IVF Treatment (1 Cycle)', slug: 'ivf-treatment', category: 'Reproductive Medicine', specialization: 'IVF Specialist', icdCode: 'Z31', description: 'In Vitro Fertilization process for infertility', avgDuration: 1 } }),

    // ORIGINAL OPHTHALMOLOGY
    prisma.treatment.upsert({ where: { slug: 'cataract-surgery' }, update: {}, create: { name: 'Cataract Surgery (Phaco)', slug: 'cataract-surgery', category: 'Ophthalmology', specialization: 'Ophthalmologist', icdCode: 'H26', description: 'Phacoemulsification with IOL implant for cataract', avgDuration: 1 } }),
    prisma.treatment.upsert({ where: { slug: 'lasik' }, update: {}, create: { name: 'LASIK Eye Surgery', slug: 'lasik', category: 'Ophthalmology', specialization: 'Refractive Surgeon', icdCode: 'H52', description: 'Laser vision correction for myopia, hyperopia, astigmatism', avgDuration: 1 } }),

    // ORIGINAL TRANSPLANTS
    prisma.treatment.upsert({ where: { slug: 'kidney-transplant' }, update: {}, create: { name: 'Kidney Transplant', slug: 'kidney-transplant', category: 'Transplant Surgery', specialization: 'Transplant Surgeon', icdCode: 'T86', description: 'Living or deceased donor renal transplantation', avgDuration: 14 } }),
    prisma.treatment.upsert({ where: { slug: 'liver-transplant' }, update: {}, create: { name: 'Liver Transplant', slug: 'liver-transplant', category: 'Transplant Surgery', specialization: 'Transplant Surgeon', icdCode: 'T86', description: 'Living donor partial or deceased donor liver transplantation', avgDuration: 21 } }),

    // ORIGINAL ENT & DERMATOLOGY
    prisma.treatment.upsert({ where: { slug: 'septoplasty' }, update: {}, create: { name: 'Septoplasty (Deviated Septum)', slug: 'septoplasty', category: 'ENT', specialization: 'ENT Surgeon', icdCode: 'J34', description: 'Surgical correction of deviated nasal septum', avgDuration: 2 } }),
    prisma.treatment.upsert({ where: { slug: 'tonsillectomy' }, update: {}, create: { name: 'Tonsillectomy', slug: 'tonsillectomy', category: 'ENT', specialization: 'ENT Surgeon', icdCode: 'J35', description: 'Surgical removal of tonsils for recurrent tonsillitis', avgDuration: 2 } }),
    prisma.treatment.upsert({ where: { slug: 'skin-grafting' }, update: {}, create: { name: 'Skin Grafting', slug: 'skin-grafting', category: 'Plastic Surgery', specialization: 'Plastic Surgeon', icdCode: 'L98', description: 'Split or full thickness skin graft for burns or wounds', avgDuration: 7 } }),
  ]);

  console.log(`✅ Created ${treatments.length} treatments`);

  // ─── HOSPITALS (Original + New) ───────────────────────────────────────────
  const hospitalData = [
    // ORIGINAL Delhi
    { name: 'Apollo Hospital Delhi', slug: 'apollo-hospital-delhi', city: 'Delhi', state: 'Delhi', address: 'Indraprastha Apollo Hospital, Mathura Road, Sarita Vihar', pincode: '110076', phone: '011-71791090', type: HospitalType.PRIVATE, beds: 700, naabhStatus: true, rating: 4.7, lat: 28.5355, lng: 77.2534, established: 1996, description: 'JCI and NABH accredited super-specialty hospital, one of India\'s largest.' },
    { name: 'Fortis Escorts Heart Institute', slug: 'fortis-escorts-delhi', city: 'Delhi', state: 'Delhi', address: 'Okhla Road, Near Sukhdev Vihar, New Delhi', pincode: '110025', phone: '011-47135000', type: HospitalType.PRIVATE, beds: 310, naabhStatus: true, rating: 4.6, lat: 28.5501, lng: 77.2803, established: 1988, description: 'Pioneering cardiac care hospital with 35+ years of excellence.' },
    { name: 'AIIMS Delhi', slug: 'aiims-delhi', city: 'Delhi', state: 'Delhi', address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi', pincode: '110029', phone: '011-26588500', type: HospitalType.GOVERNMENT, beds: 2478, naabhStatus: true, rating: 4.5, lat: 28.5677, lng: 77.2099, established: 1956, description: 'India\'s premier government medical institution with lowest cost treatments.' },
    { name: 'Max Super Speciality Hospital Saket', slug: 'max-hospital-saket', city: 'Delhi', state: 'Delhi', address: '1 2 Press Enclave Road, Saket, New Delhi', pincode: '110017', phone: '011-26515050', type: HospitalType.PRIVATE, beds: 500, naabhStatus: true, rating: 4.5, lat: 28.5274, lng: 77.2159, established: 2000, description: 'NABH and JCI accredited hospital with comprehensive cancer and cardiac care.' },
    { name: 'Sir Ganga Ram Hospital', slug: 'sir-ganga-ram-hospital', city: 'Delhi', state: 'Delhi', address: 'Rajinder Nagar, New Delhi', pincode: '110060', phone: '011-25750000', type: HospitalType.CHARITABLE, beds: 675, naabhStatus: true, rating: 4.4, lat: 28.6373, lng: 77.1879, established: 1954, description: 'One of Delhi\'s oldest and most respected multi-specialty hospitals.' },
    { name: 'Medanta The Medicity', slug: 'medanta-gurugram', city: 'Delhi', state: 'Haryana', address: 'CH Baktawar Singh Road, Sector 38, Gurugram', pincode: '122001', phone: '0124-4141414', type: HospitalType.PRIVATE, beds: 1250, naabhStatus: true, rating: 4.8, lat: 28.4367, lng: 77.0449, established: 2009, description: 'One of India\'s largest multi-specialty hospitals with 45+ specialties.' },
    { name: 'Safdarjung Hospital', slug: 'safdarjung-hospital', city: 'Delhi', state: 'Delhi', address: 'Ansari Nagar West, New Delhi', pincode: '110029', phone: '011-26707444', type: HospitalType.GOVERNMENT, beds: 1531, naabhStatus: false, rating: 3.8, lat: 28.5686, lng: 77.2079, established: 1954, description: 'Major government hospital with very affordable treatment costs.' },
    { name: 'BLK-Max Super Speciality Hospital', slug: 'blk-max-hospital', city: 'Delhi', state: 'Delhi', address: '5 Pusa Road, Karol Bagh, New Delhi', pincode: '110005', phone: '011-30403040', type: HospitalType.PRIVATE, beds: 700, naabhStatus: true, rating: 4.3, lat: 28.6457, lng: 77.1832, established: 1959, description: 'Multi-specialty hospital known for bone marrow transplants and oncology.' },
    { name: 'Primus Super Speciality Hospital', slug: 'primus-hospital-delhi', city: 'Delhi', state: 'Delhi', address: '2 Chandragupta Marg, Chanakyapuri, New Delhi', pincode: '110021', phone: '011-66206620', type: HospitalType.PRIVATE, beds: 150, naabhStatus: true, rating: 4.2, lat: 28.5977, lng: 77.1773, established: 2007, description: 'Boutique super-specialty hospital in diplomatic enclave.' },
    { name: 'GB Pant Hospital', slug: 'gb-pant-hospital', city: 'Delhi', state: 'Delhi', address: 'JLN Marg, New Delhi', pincode: '110002', phone: '011-23234242', type: HospitalType.GOVERNMENT, beds: 802, naabhStatus: false, rating: 3.9, lat: 28.6333, lng: 77.2411, established: 1963, description: 'Govt cardiac institute with very affordable bypass and angioplasty.' },

    // ORIGINAL Mumbai
    { name: 'Kokilaben Dhirubhai Ambani Hospital', slug: 'kokilaben-hospital-mumbai', city: 'Mumbai', state: 'Maharashtra', address: 'Rao Saheb, Achutrao Patwardhan Marg, Four Bungalows, Andheri West', pincode: '400053', phone: '022-30999999', type: HospitalType.PRIVATE, beds: 750, naabhStatus: true, rating: 4.7, lat: 19.1309, lng: 72.8258, established: 2009, description: 'State-of-the-art hospital with robotic surgery and proton therapy.' },
    { name: 'Lilavati Hospital', slug: 'lilavati-hospital-mumbai', city: 'Mumbai', state: 'Maharashtra', address: 'A-791, Bandra Reclamation, Bandra West, Mumbai', pincode: '400050', phone: '022-26751000', type: HospitalType.PRIVATE, beds: 323, naabhStatus: true, rating: 4.5, lat: 19.0508, lng: 72.8271, established: 1978, description: 'Renowned private hospital in Bandra known for cardiac and orthopedic care.' },
    { name: 'Hinduja Hospital', slug: 'hinduja-hospital-mumbai', city: 'Mumbai', state: 'Maharashtra', address: 'Veer Savarkar Marg, Mahim, Mumbai', pincode: '400016', phone: '022-24452222', type: HospitalType.PRIVATE, beds: 351, naabhStatus: true, rating: 4.4, lat: 19.0434, lng: 72.8394, established: 1951, description: 'Pioneering hospital with excellence in kidney transplants and oncology.' },
    { name: 'KEM Hospital Mumbai', slug: 'kem-hospital-mumbai', city: 'Mumbai', state: 'Maharashtra', address: 'Acharya Donde Marg, Parel, Mumbai', pincode: '400012', phone: '022-24136051', type: HospitalType.GOVERNMENT, beds: 1800, naabhStatus: false, rating: 4.0, lat: 19.0022, lng: 72.8414, established: 1926, description: 'One of Mumbai\'s largest government hospitals with excellent trauma care.' },
    { name: 'Jaslok Hospital', slug: 'jaslok-hospital-mumbai', city: 'Mumbai', state: 'Maharashtra', address: '15 Dr. Deshmukh Marg, Pedder Road, Mumbai', pincode: '400026', phone: '022-66573333', type: HospitalType.PRIVATE, beds: 349, naabhStatus: true, rating: 4.5, lat: 18.9684, lng: 72.8096, established: 1973, description: 'Pioneering multi-specialty hospital known for neurosurgery and oncology.' },
    { name: 'Bombay Hospital', slug: 'bombay-hospital-mumbai', city: 'Mumbai', state: 'Maharashtra', address: '12 Marine Lines, Mumbai', pincode: '400020', phone: '022-22067676', type: HospitalType.CHARITABLE, beds: 620, naabhStatus: true, rating: 4.3, lat: 18.9370, lng: 72.8228, established: 1950, description: 'Iconic charitable hospital with affordable costs and quality care.' },
    { name: 'Nanavati Max Super Speciality Hospital', slug: 'nanavati-hospital-mumbai', city: 'Mumbai', state: 'Maharashtra', address: 'SV Road, Vile Parle West, Mumbai', pincode: '400056', phone: '022-26267500', type: HospitalType.PRIVATE, beds: 350, naabhStatus: true, rating: 4.4, lat: 19.1030, lng: 72.8448, established: 1950, description: 'Multi-specialty hospital known for cardiac and liver transplant programs.' },
    { name: 'Tata Memorial Hospital', slug: 'tata-memorial-hospital-mumbai', city: 'Mumbai', state: 'Maharashtra', address: 'Dr Ernest Borges Road, Parel, Mumbai', pincode: '400012', phone: '022-24177000', type: HospitalType.GOVERNMENT, beds: 629, naabhStatus: true, rating: 4.6, lat: 19.0046, lng: 72.8412, established: 1941, description: 'India\'s premier cancer hospital — government rates for all oncology treatments.' },
    { name: 'Fortis Hospital Mulund', slug: 'fortis-hospital-mulund', city: 'Mumbai', state: 'Maharashtra', address: 'Mulund Goregaon Link Road, Mumbai', pincode: '400078', phone: '022-67971000', type: HospitalType.PRIVATE, beds: 315, naabhStatus: true, rating: 4.3, lat: 19.1776, lng: 72.9596, established: 2007, description: 'Multi-specialty hospital in eastern Mumbai suburb with strong cardiac care.' },
    { name: 'Wockhardt Hospital', slug: 'wockhardt-hospital-mumbai', city: 'Mumbai', state: 'Maharashtra', address: '1877 Dr Anandrao Nair Road, Mumbai Central, Mumbai', pincode: '400011', phone: '022-61781234', type: HospitalType.PRIVATE, beds: 350, naabhStatus: true, rating: 4.2, lat: 18.9671, lng: 72.8195, established: 1989, description: 'Harvard Medical International accredited hospital with advanced cardiac care.' },

    // ORIGINAL Bengaluru
    { name: 'Manipal Hospital Bangalore', slug: 'manipal-hospital-bangalore', city: 'Bengaluru', state: 'Karnataka', address: '98 HAL Airport Road, Bengaluru', pincode: '560017', phone: '080-25024444', type: HospitalType.PRIVATE, beds: 600, naabhStatus: true, rating: 4.6, lat: 12.9577, lng: 77.6486, established: 1991, description: 'Premium multi-specialty hospital with JCI accreditation and robotic surgery.' },
    { name: 'Narayana Health City Bangalore', slug: 'narayana-health-bangalore', city: 'Bengaluru', state: 'Karnataka', address: '258/A, Bommasandra Industrial Area, Anekal Taluk, Bengaluru', pincode: '560099', phone: '080-71222222', type: HospitalType.PRIVATE, beds: 3000, naabhStatus: true, rating: 4.5, lat: 12.8158, lng: 77.6803, established: 2000, description: 'India\'s largest cardiac care complex with highly affordable pricing.' },
    { name: 'Fortis Hospital Bangalore', slug: 'fortis-hospital-bangalore', city: 'Bengaluru', state: 'Karnataka', address: 'Bannerghatta Road, Bengaluru', pincode: '560076', phone: '080-66214444', type: HospitalType.PRIVATE, beds: 400, naabhStatus: true, rating: 4.4, lat: 12.8826, lng: 77.5989, established: 2006, description: 'NABH and JCI accredited multi-specialty hospital on Bannerghatta Road.' },
    { name: 'Apollo Hospital Bangalore', slug: 'apollo-hospital-bangalore', city: 'Bengaluru', state: 'Karnataka', address: '154/11 Opp IIM-B, Bannerghatta Road, Bengaluru', pincode: '560076', phone: '080-26304050', type: HospitalType.PRIVATE, beds: 350, naabhStatus: true, rating: 4.5, lat: 12.8932, lng: 77.5959, established: 1996, description: 'Apollo flagship in Bangalore with 55+ specialties and international patient care.' },
    { name: 'Vikram Hospital Bangalore', slug: 'vikram-hospital-bangalore', city: 'Bengaluru', state: 'Karnataka', address: '71/1 Millers Road, Vasanth Nagar, Bengaluru', pincode: '560052', phone: '080-41500000', type: HospitalType.PRIVATE, beds: 300, naabhStatus: true, rating: 4.3, lat: 12.9915, lng: 77.5960, established: 1993, description: 'Multi-specialty hospital known for orthopaedics, urology, and kidney transplants.' },
    { name: 'NIMHANS Bangalore', slug: 'nimhans-bangalore', city: 'Bengaluru', state: 'Karnataka', address: 'Hosur Road, Lakkasandra, Bengaluru', pincode: '560029', phone: '080-46110007', type: HospitalType.GOVERNMENT, beds: 800, naabhStatus: true, rating: 4.4, lat: 12.9378, lng: 77.5961, established: 1954, description: 'National institute for mental health and neurology — government facility.' },
    { name: 'St. John\'s Medical College Hospital', slug: 'st-johns-bangalore', city: 'Bengaluru', state: 'Karnataka', address: 'John Nagar, Koramangala, Bengaluru', pincode: '560034', phone: '080-22065000', type: HospitalType.CHARITABLE, beds: 1260, naabhStatus: true, rating: 4.3, lat: 12.9438, lng: 77.6193, established: 1963, description: 'Major teaching hospital with affordable care and strong surgical programs.' },
    { name: 'BGS Gleneagles Global Hospital', slug: 'bgs-global-hospital-bangalore', city: 'Bengaluru', state: 'Karnataka', address: '67 Uttarahalli Road, Kengeri, Bengaluru', pincode: '560060', phone: '080-50555555', type: HospitalType.PRIVATE, beds: 800, naabhStatus: true, rating: 4.2, lat: 12.9084, lng: 77.4958, established: 2008, description: 'Multi-organ transplant centre and multi-specialty hospital in south Bangalore.' },

    // NEW Chennai
    { name: 'Apollo Hospital Greams Road', slug: 'apollo-chennai', city: 'Chennai', state: 'Tamil Nadu', address: '21 Greams Lane', type: HospitalType.PRIVATE, naabhStatus: true, rating: 4.8, beds: 560 },
    { name: 'MIOT International', slug: 'miot-chennai', city: 'Chennai', state: 'Tamil Nadu', address: 'Mount Poonamallee Road', type: HospitalType.PRIVATE, naabhStatus: true, rating: 4.6, beds: 1000 },

    // NEW Hyderabad
    { name: 'AIG Hospitals', slug: 'aig-hyderabad', city: 'Hyderabad', state: 'Telangana', address: 'Gachibowli', type: HospitalType.PRIVATE, naabhStatus: true, rating: 4.9, beds: 800 },
    { name: 'Yashoda Hospitals', slug: 'yashoda-secunderabad', city: 'Hyderabad', state: 'Telangana', address: 'Secunderabad', type: HospitalType.PRIVATE, naabhStatus: true, rating: 4.7, beds: 1200 },

    // NEW Pune
    { name: 'Ruby Hall Clinic', slug: 'ruby-hall-pune', city: 'Pune', state: 'Maharashtra', address: 'Sassoon Road', type: HospitalType.PRIVATE, naabhStatus: true, rating: 4.6, beds: 850 },
    { name: 'Sahyadri Super Speciality Hospital', slug: 'sahyadri-pune', city: 'Pune', state: 'Maharashtra', address: 'Deccan Gymkhana', type: HospitalType.PRIVATE, naabhStatus: true, rating: 4.5, beds: 300 },

    // NEW Ahmedabad
    { name: 'Zydus Hospitals', slug: 'zydus-ahmedabad', city: 'Ahmedabad', state: 'Gujarat', address: 'SG Highway', type: HospitalType.PRIVATE, naabhStatus: true, rating: 4.8, beds: 550 },
    { name: 'Apollo Hospitals Ahmedabad', slug: 'apollo-ahmedabad', city: 'Ahmedabad', state: 'Gujarat', address: 'Bhat GIDC', type: HospitalType.PRIVATE, naabhStatus: true, rating: 4.6, beds: 400 },

    // NEW Kolkata
    { name: 'AMRI Hospitals', slug: 'amri-kolkata', city: 'Kolkata', state: 'West Bengal', address: 'Dhakuria', type: HospitalType.PRIVATE, naabhStatus: true, rating: 4.3, beds: 400 },
    { name: 'Medica Superspecialty Hospital', slug: 'medica-kolkata', city: 'Kolkata', state: 'West Bengal', address: 'Mukundapur', type: HospitalType.PRIVATE, naabhStatus: true, rating: 4.5, beds: 500 },
  ];

  const hospitals = await Promise.all(
    hospitalData.map(h => prisma.hospital.upsert({ where: { slug: h.slug }, update: {}, create: h }))
  );
  console.log(`✅ Created ${hospitals.length} hospitals`);

  // ─── HOSPITAL–TREATMENT MAPPINGS ────────────────────────────────────────
  const htMappings = [
    // ORIGINAL Delhi Mappings
    { hospitalSlug: 'apollo-hospital-delhi', treatmentSlug: 'knee-replacement', min: 160000, avg: 220000, max: 320000 },
    { hospitalSlug: 'apollo-hospital-delhi', treatmentSlug: 'hip-replacement', min: 180000, avg: 250000, max: 380000 },
    { hospitalSlug: 'apollo-hospital-delhi', treatmentSlug: 'angioplasty', min: 200000, avg: 280000, max: 420000 },
    { hospitalSlug: 'apollo-hospital-delhi', treatmentSlug: 'bypass-surgery', min: 300000, avg: 425000, max: 600000 },
    { hospitalSlug: 'apollo-hospital-delhi', treatmentSlug: 'kidney-stone-removal', min: 80000, avg: 120000, max: 180000 },
    { hospitalSlug: 'apollo-hospital-delhi', treatmentSlug: 'kidney-transplant', min: 700000, avg: 950000, max: 1400000 },
    { hospitalSlug: 'apollo-hospital-delhi', treatmentSlug: 'cataract-surgery', min: 30000, avg: 55000, max: 90000 },
    { hospitalSlug: 'fortis-escorts-delhi', treatmentSlug: 'angioplasty', min: 180000, avg: 260000, max: 380000 },
    { hospitalSlug: 'fortis-escorts-delhi', treatmentSlug: 'bypass-surgery', min: 280000, avg: 390000, max: 550000 },
    { hospitalSlug: 'fortis-escorts-delhi', treatmentSlug: 'pacemaker-implant', min: 250000, avg: 380000, max: 550000 },
    { hospitalSlug: 'fortis-escorts-delhi', treatmentSlug: 'echocardiography', min: 2000, avg: 3500, max: 6000 },
    { hospitalSlug: 'aiims-delhi', treatmentSlug: 'knee-replacement', min: 40000, avg: 65000, max: 100000 },
    { hospitalSlug: 'aiims-delhi', treatmentSlug: 'bypass-surgery', min: 80000, avg: 120000, max: 180000 },
    { hospitalSlug: 'aiims-delhi', treatmentSlug: 'kidney-transplant', min: 200000, avg: 300000, max: 450000 },
    { hospitalSlug: 'aiims-delhi', treatmentSlug: 'brain-tumor-surgery', min: 150000, avg: 220000, max: 350000 },
    { hospitalSlug: 'aiims-delhi', treatmentSlug: 'cataract-surgery', min: 8000, avg: 15000, max: 30000 },
    { hospitalSlug: 'aiims-delhi', treatmentSlug: 'appendectomy', min: 20000, avg: 35000, max: 60000 },
    { hospitalSlug: 'max-hospital-saket', treatmentSlug: 'knee-replacement', min: 155000, avg: 210000, max: 310000 },
    { hospitalSlug: 'max-hospital-saket', treatmentSlug: 'liver-transplant', min: 1400000, avg: 1800000, max: 2500000 },
    { hospitalSlug: 'max-hospital-saket', treatmentSlug: 'caesarean-section', min: 60000, avg: 90000, max: 150000 },
    { hospitalSlug: 'medanta-gurugram', treatmentSlug: 'bypass-surgery', min: 350000, avg: 480000, max: 700000 },
    { hospitalSlug: 'medanta-gurugram', treatmentSlug: 'knee-replacement', min: 180000, avg: 250000, max: 380000 },
    { hospitalSlug: 'medanta-gurugram', treatmentSlug: 'liver-transplant', min: 1600000, avg: 2100000, max: 3000000 },
    { hospitalSlug: 'medanta-gurugram', treatmentSlug: 'kidney-transplant', min: 800000, avg: 1100000, max: 1600000 },
    { hospitalSlug: 'medanta-gurugram', treatmentSlug: 'spinal-fusion', min: 280000, avg: 390000, max: 580000 },
    { hospitalSlug: 'gb-pant-hospital', treatmentSlug: 'angioplasty', min: 60000, avg: 90000, max: 140000 },
    { hospitalSlug: 'gb-pant-hospital', treatmentSlug: 'bypass-surgery', min: 70000, avg: 110000, max: 170000 },

    // ORIGINAL Mumbai Mappings
    { hospitalSlug: 'kokilaben-hospital-mumbai', treatmentSlug: 'knee-replacement', min: 200000, avg: 290000, max: 420000 },
    { hospitalSlug: 'kokilaben-hospital-mumbai', treatmentSlug: 'bypass-surgery', min: 380000, avg: 520000, max: 750000 },
    { hospitalSlug: 'kokilaben-hospital-mumbai', treatmentSlug: 'kidney-transplant', min: 900000, avg: 1200000, max: 1700000 },
    { hospitalSlug: 'kokilaben-hospital-mumbai', treatmentSlug: 'spinal-fusion', min: 320000, avg: 440000, max: 650000 },
    { hospitalSlug: 'lilavati-hospital-mumbai', treatmentSlug: 'angioplasty', min: 220000, avg: 310000, max: 450000 },
    { hospitalSlug: 'lilavati-hospital-mumbai', treatmentSlug: 'knee-replacement', min: 190000, avg: 270000, max: 400000 },
    { hospitalSlug: 'lilavati-hospital-mumbai', treatmentSlug: 'caesarean-section', min: 70000, avg: 110000, max: 180000 },
    { hospitalSlug: 'tata-memorial-hospital-mumbai', treatmentSlug: 'chemotherapy', min: 8000, avg: 15000, max: 40000 },
    { hospitalSlug: 'tata-memorial-hospital-mumbai', treatmentSlug: 'radiation-therapy', min: 60000, avg: 110000, max: 220000 },

    // ORIGINAL Bangalore Mappings
    { hospitalSlug: 'manipal-hospital-bangalore', treatmentSlug: 'knee-replacement', min: 170000, avg: 235000, max: 350000 },
    { hospitalSlug: 'manipal-hospital-bangalore', treatmentSlug: 'kidney-transplant', min: 750000, avg: 1000000, max: 1450000 },
    { hospitalSlug: 'manipal-hospital-bangalore', treatmentSlug: 'brain-tumor-surgery', min: 280000, avg: 400000, max: 620000 },
    { hospitalSlug: 'narayana-health-bangalore', treatmentSlug: 'bypass-surgery', min: 150000, avg: 210000, max: 320000 },
    { hospitalSlug: 'narayana-health-bangalore', treatmentSlug: 'angioplasty', min: 120000, avg: 175000, max: 270000 },
    { hospitalSlug: 'narayana-health-bangalore', treatmentSlug: 'pacemaker-implant', min: 180000, avg: 260000, max: 390000 },
    { hospitalSlug: 'apollo-hospital-bangalore', treatmentSlug: 'knee-replacement', min: 165000, avg: 230000, max: 340000 },
    { hospitalSlug: 'apollo-hospital-bangalore', treatmentSlug: 'cataract-surgery', min: 28000, avg: 50000, max: 85000 },
    { hospitalSlug: 'apollo-hospital-bangalore', treatmentSlug: 'lasik', min: 35000, avg: 55000, max: 80000 },

    // NEW City Mappings
    { hospitalSlug: 'apollo-hospital-delhi', treatmentSlug: 'dengue-treatment', min: 25000, avg: 40000, max: 80000 },
    { hospitalSlug: 'medanta-gurugram', treatmentSlug: 'bone-marrow-transplant', min: 1200000, avg: 1800000, max: 2500000 },
    { hospitalSlug: 'kokilaben-hospital-mumbai', treatmentSlug: 'shoulder-replacement', min: 250000, avg: 350000, max: 480000 },
    { hospitalSlug: 'lilavati-hospital-mumbai', treatmentSlug: 'ivf-treatment', min: 120000, avg: 160000, max: 250000 },
    { hospitalSlug: 'narayana-health-bangalore', treatmentSlug: 'valve-replacement', min: 200000, avg: 280000, max: 400000 },
    { hospitalSlug: 'apollo-chennai', treatmentSlug: 'thyroidectomy', min: 80000, avg: 110000, max: 150000 },
    { hospitalSlug: 'miot-chennai', treatmentSlug: 'hip-replacement', min: 180000, avg: 240000, max: 310000 },
    { hospitalSlug: 'aig-hyderabad', treatmentSlug: 'endoscopy', min: 8000, avg: 12000, max: 20000 },
    { hospitalSlug: 'aig-hyderabad', treatmentSlug: 'bariatric-surgery', min: 280000, avg: 360000, max: 480000 },
    { hospitalSlug: 'yashoda-secunderabad', treatmentSlug: 'asthma-management', min: 15000, avg: 25000, max: 45000 },
    { hospitalSlug: 'ruby-hall-pune', treatmentSlug: 'angioplasty', min: 110000, avg: 160000, max: 240000 },
    { hospitalSlug: 'sahyadri-pune', treatmentSlug: 'gallbladder-removal', min: 60000, avg: 85000, max: 120000 },
    { hospitalSlug: 'zydus-ahmedabad', treatmentSlug: 'diabetes-management', min: 20000, avg: 35000, max: 60000 },
    { hospitalSlug: 'apollo-ahmedabad', treatmentSlug: 'knee-replacement', min: 140000, avg: 190000, max: 260000 },
    { hospitalSlug: 'medica-kolkata', treatmentSlug: 'bypass-surgery', min: 200000, avg: 300000, max: 450000 },
    { hospitalSlug: 'amri-kolkata', treatmentSlug: 'dengue-treatment', min: 18000, avg: 30000, max: 55000 },
  ];

  for (const m of htMappings) {
    const hospital = hospitals.find(h => h.slug === m.hospitalSlug);
    const treatment = treatments.find(t => t.slug === m.treatmentSlug);
    if (hospital && treatment) {
      await prisma.hospitalTreatment.upsert({
        where: { hospitalId_treatmentId: { hospitalId: hospital.id, treatmentId: treatment.id } },
        update: {},
        create: { hospitalId: hospital.id, treatmentId: treatment.id, minCostEstimate: m.min, avgCostEstimate: m.avg, maxCostEstimate: m.max }
      });
    }
  }
  console.log(`✅ Created ${htMappings.length} hospital-treatment mappings`);

  // ─── DOCTORS (Original bios + New) ───────────────────────────────────────
  const doctorData = [
    // ORIGINAL Doctors with bios and qualifications
    { name: 'Dr. Rajiv Anand', specialization: 'Orthopaedic Surgeon', qualification: 'MBBS, MS (Ortho), Fellowship Joint Replacement (UK)', experienceYears: 22, hospitalSlug: 'apollo-hospital-delhi', rating: 4.8, bio: 'Pioneer in minimally invasive knee and hip replacement techniques.' },
    { name: 'Dr. Priya Sharma', specialization: 'Cardiologist', qualification: 'MBBS, MD (Medicine), DM (Cardiology)', experienceYears: 18, hospitalSlug: 'apollo-hospital-delhi', rating: 4.7, bio: 'Interventional cardiologist specializing in complex coronary interventions.' },
    { name: 'Dr. Anil Kumar', specialization: 'Nephrologist', qualification: 'MBBS, MD, DM (Nephrology)', experienceYears: 25, hospitalSlug: 'apollo-hospital-delhi', rating: 4.9, bio: 'Senior kidney transplant specialist with 500+ successful transplants.' },
    { name: 'Dr. Suresh Trehan', specialization: 'Cardiac Surgeon', qualification: 'MBBS, MS, MCh (CTVS)', experienceYears: 40, hospitalSlug: 'medanta-gurugram', rating: 4.9, bio: 'Chairman Medanta, globally acclaimed cardiac surgeon with 48,000+ cardiac surgeries.' },
    { name: 'Dr. Naresh Trehan', specialization: 'Cardiothoracic Surgeon', qualification: 'MBBS, MS, MCh', experienceYears: 38, hospitalSlug: 'fortis-escorts-delhi', rating: 4.8, bio: 'Veteran cardiac surgeon known for pioneering off-pump bypass techniques in India.' },
    { name: 'Dr. Ramesh Gupta', specialization: 'Neurosurgeon', qualification: 'MBBS, MS, MCh (Neurosurgery)', experienceYears: 28, hospitalSlug: 'aiims-delhi', rating: 4.8, bio: 'Head of Neurosurgery at AIIMS, renowned for complex brain tumour resection.' },
    { name: 'Dr. Vandana Singh', specialization: 'Gynaecologist', qualification: 'MBBS, MS (OBG), FRCOG (UK)', experienceYears: 20, hospitalSlug: 'max-hospital-saket', rating: 4.7, bio: 'Senior gynaecologist specializing in laparoscopic hysterectomy and high-risk pregnancy.' },
    { name: 'Dr. Deepak Kumar', specialization: 'Urologist', qualification: 'MBBS, MS, MCh (Urology)', experienceYears: 16, hospitalSlug: 'sir-ganga-ram-hospital', rating: 4.6, bio: 'Urological oncologist and kidney stone specialist using laser lithotripsy.' },
    { name: 'Dr. Meena Iyer', specialization: 'Oncologist', qualification: 'MBBS, MD (Oncology), DNB', experienceYears: 19, hospitalSlug: 'kokilaben-hospital-mumbai', rating: 4.7, bio: 'Breast and GI cancer specialist with expertise in targeted therapy.' },
    { name: 'Dr. Vivek Rao', specialization: 'Cardiac Surgeon', qualification: 'MBBS, MS, MCh (CTVS)', experienceYears: 24, hospitalSlug: 'kokilaben-hospital-mumbai', rating: 4.8, bio: 'Robotic cardiac surgery specialist, over 3000 open heart surgeries.' },
    { name: 'Dr. Anita Patel', specialization: 'Orthopaedic Surgeon', qualification: 'MBBS, MS (Ortho), AO Fellowship', experienceYears: 17, hospitalSlug: 'lilavati-hospital-mumbai', rating: 4.6, bio: 'Joint replacement specialist focused on young patients and complex revisions.' },
    { name: 'Dr. Rajan Mehta', specialization: 'Cardiologist', qualification: 'MBBS, MD, DM (Cardiology), FACC (USA)', experienceYears: 22, hospitalSlug: 'jaslok-hospital-mumbai', rating: 4.7, bio: 'Electrophysiologist known for complex arrhythmia ablations and pacemaker implants.' },
    { name: 'Dr. Shyam Prasad', specialization: 'Transplant Surgeon', qualification: 'MBBS, MS, MCh (Transplant)', experienceYears: 30, hospitalSlug: 'hinduja-hospital-mumbai', rating: 4.9, bio: 'Pioneer of kidney transplant in Maharashtra with 1200+ transplants performed.' },
    { name: 'Dr. Lakshmi Nair', specialization: 'Radiation Oncologist', qualification: 'MBBS, MD (Radiation Oncology)', experienceYears: 21, hospitalSlug: 'tata-memorial-hospital-mumbai', rating: 4.8, bio: 'Head of IMRT unit at Tata Memorial, expert in head-neck and prostate cancers.' },
    { name: 'Dr. Harish Bhat', specialization: 'Orthopaedic Surgeon', qualification: 'MBBS, MS (Ortho), Fellowship (Germany)', experienceYears: 19, hospitalSlug: 'manipal-hospital-bangalore', rating: 4.7, bio: 'Computer-navigated and robotic knee replacement specialist.' },
    { name: 'Dr. Devi Shetty', specialization: 'Cardiac Surgeon', qualification: 'MBBS, MCh (Cardiac Surgery)', experienceYears: 35, hospitalSlug: 'narayana-health-bangalore', rating: 4.9, bio: 'Founder of Narayana Health, performed Mother Teresa\'s cardiac surgery. Pioneer of affordable healthcare.' },
    { name: 'Dr. Srinath Reddy', specialization: 'Cardiologist', qualification: 'MBBS, MD, DM (Cardiology)', experienceYears: 26, hospitalSlug: 'apollo-hospital-bangalore', rating: 4.7, bio: 'Interventional cardiologist known for complex bifurcation stenting techniques.' },
    { name: 'Dr. Padmini Krishnan', specialization: 'Neurologist', qualification: 'MBBS, MD, DM (Neurology)', experienceYears: 20, hospitalSlug: 'nimhans-bangalore', rating: 4.8, bio: 'Senior neurologist at NIMHANS specializing in epilepsy surgery and movement disorders.' },
    { name: 'Dr. Thomas Varghese', specialization: 'Urologist', qualification: 'MBBS, MS, MCh (Urology), FRCS (UK)', experienceYears: 23, hospitalSlug: 'vikram-hospital-bangalore', rating: 4.6, bio: 'Laparoscopic urologist with expertise in PCNL and robotic prostatectomy.' },
    { name: 'Dr. Anjali Gupta', specialization: 'Gynaecologist', qualification: 'MBBS, MS (OBG), MRCOG (UK)', experienceYears: 15, hospitalSlug: 'st-johns-bangalore', rating: 4.5, bio: 'High-risk obstetric specialist with expertise in laparoscopic procedures.' },
    { name: 'Dr. K. Krishnamurthy', specialization: 'Spine Surgeon', qualification: 'MBBS, MS, MCh (Spine Surgery)', experienceYears: 21, hospitalSlug: 'bgs-global-hospital-bangalore', rating: 4.6, bio: 'Minimally invasive spine surgery specialist for disc disease and scoliosis.' },
    { name: 'Dr. Mohit Garg', specialization: 'ENT Surgeon', qualification: 'MBBS, MS (ENT), FRCS (UK)', experienceYears: 14, hospitalSlug: 'blk-max-hospital', rating: 4.5, bio: 'Cochlear implant and skull base surgery specialist.' },
    { name: 'Dr. Sanjay Agarwal', specialization: 'Ophthalmologist', qualification: 'MBBS, MS (Ophthalmology), FRCS', experienceYears: 22, hospitalSlug: 'primus-hospital-delhi', rating: 4.6, bio: 'Refractive and cataract surgeon, trained at Bascom Palmer Eye Institute, USA.' },

    // NEW Doctors
    { name: 'Dr. Prathap C. Reddy', specialization: 'Cardiologist', qualification: 'MD', experienceYears: 40, hospitalSlug: 'apollo-chennai', rating: 4.9, bio: 'Founder of Apollo Hospitals.' },
    { name: 'Dr. D. Nageshwar Reddy', specialization: 'Gastroenterologist', qualification: 'MD, DM', experienceYears: 38, hospitalSlug: 'aig-hyderabad', rating: 4.9, bio: 'World-renowned gastroenterologist.' },
    { name: 'Dr. Purvez Grant', specialization: 'Cardiologist', qualification: 'MD', experienceYears: 30, hospitalSlug: 'ruby-hall-pune', rating: 4.7, bio: 'Leading cardiologist in Pune.' },
    { name: 'Dr. V. N. Shah', specialization: 'Diabetologist', qualification: 'MD', experienceYears: 25, hospitalSlug: 'zydus-ahmedabad', rating: 4.8, bio: 'Expert in diabetes management.' },
    { name: 'Dr. Kunal Sarkar', specialization: 'Cardiac Surgeon', qualification: 'FRCS', experienceYears: 28, hospitalSlug: 'medica-kolkata', rating: 4.7, bio: 'Prominent cardiac surgeon in Eastern India.' },
  ];

  for (const d of doctorData) {
    const hospital = hospitals.find(h => h.slug === d.hospitalSlug);
    if (hospital) {
      await prisma.doctor.create({
        data: {
          name: d.name,
          specialization: d.specialization,
          qualification: d.qualification,
          experienceYears: d.experienceYears,
          hospitalId: hospital.id,
          rating: d.rating,
          bio: d.bio
        }
      }).catch(() => { }); // Skip duplicates
    }
  }
  console.log(`✅ Created ${doctorData.length} doctors`);

  // ─── ORIGINAL SAMPLE BILLS & FEEDBACK ─────────────────────────────────────
  const apolloDelhi = hospitals.find(h => h.slug === 'apollo-hospital-delhi')!;
  const aiims = hospitals.find(h => h.slug === 'aiims-delhi')!;
  const kneeReplacement = treatments.find(t => t.slug === 'knee-replacement')!;
  const bypass = treatments.find(t => t.slug === 'bypass-surgery')!;
  const angioplasty = treatments.find(t => t.slug === 'angioplasty')!;

  const sampleBills = [
    { hospitalId: apolloDelhi.id, treatmentId: kneeReplacement.id, city: 'Delhi', totalCost: 215000, roomCharges: 45000, implantCost: 85000, surgeryFee: 55000, pharmacyCost: 18000, otherCharges: 12000, stayDays: 5, status: 'BILL_VERIFIED' as const },
    { hospitalId: apolloDelhi.id, treatmentId: kneeReplacement.id, city: 'Delhi', totalCost: 235000, roomCharges: 52000, implantCost: 92000, surgeryFee: 58000, pharmacyCost: 20000, otherCharges: 13000, stayDays: 6, status: 'BILL_VERIFIED' as const },
    { hospitalId: apolloDelhi.id, treatmentId: angioplasty.id, city: 'Delhi', totalCost: 275000, roomCharges: 40000, implantCost: 130000, surgeryFee: 65000, pharmacyCost: 22000, otherCharges: 18000, stayDays: 3, status: 'BILL_VERIFIED' as const },
    { hospitalId: aiims.id, treatmentId: kneeReplacement.id, city: 'Delhi', totalCost: 62000, roomCharges: 15000, implantCost: 28000, surgeryFee: 12000, pharmacyCost: 5000, otherCharges: 2000, stayDays: 5, status: 'BILL_VERIFIED' as const },
    { hospitalId: aiims.id, treatmentId: bypass.id, city: 'Delhi', totalCost: 115000, roomCharges: 28000, implantCost: 45000, surgeryFee: 25000, pharmacyCost: 12000, otherCharges: 5000, stayDays: 10, status: 'BILL_VERIFIED' as const },
  ];

  await prisma.bill.createMany({ data: sampleBills, skipDuplicates: true });
  console.log(`✅ Created original manual bills`);

  await prisma.patientFeedback.createMany({
    data: [
      { hospitalId: apolloDelhi.id, treatmentId: kneeReplacement.id, overallScore: 4.5, doctorScore: 4.7, facilityScore: 4.6, careScore: 4.4, costTransparency: 3.8, recoveryDays: 45, complicationFlag: false, reviewText: 'Excellent surgery, very professional team. Cost was on higher side but worth it for the quality.', isVerified: true },
      { hospitalId: aiims.id, treatmentId: kneeReplacement.id, overallScore: 4.2, doctorScore: 4.8, facilityScore: 3.5, careScore: 4.0, costTransparency: 4.5, recoveryDays: 52, complicationFlag: false, reviewText: 'Best doctors in India, facilities basic but treatment outcomes are excellent. Very affordable.', isVerified: true },
    ],
    skipDuplicates: true
  });
  console.log(`✅ Created original manual patient feedback`);

  // ─── MASS DATA GENERATOR FOR SCORE RELIABILITY (Added from expansion) ────
  console.log(`⚙️ Generating additional background data to activate ClearMed Scores...`);

  let autoBills = 0;
  let autoReviews = 0;

  for (const m of htMappings) {
    const hospital = hospitals.find(h => h.slug === m.hospitalSlug);
    const treatment = treatments.find(t => t.slug === m.treatmentSlug);

    if (hospital && treatment) {
      // Generate 10 verified bills per mapping
      for (let i = 0; i < 10; i++) {
        const costVariation = m.avg * (0.85 + Math.random() * 0.3); // +/- 15% from avg
        await prisma.bill.create({
          data: {
            hospitalId: hospital.id,
            treatmentId: treatment.id,
            city: hospital.city,
            totalCost: Math.round(costVariation),
            status: 'BILL_VERIFIED',
            stayDays: Math.floor(treatment.avgDuration! * (0.8 + Math.random() * 0.4)),
          }
        });
        autoBills++;
      }

      // Generate 10 patient feedbacks per mapping
      for (let i = 0; i < 10; i++) {
        let score = (hospital.rating || 4.0) + (Math.random() * 1.0 - 0.5);
        if (score > 5) score = 5;
        if (score < 1) score = 1;

        await prisma.patientFeedback.create({
          data: {
            hospitalId: hospital.id,
            treatmentId: treatment.id,
            overallScore: score,
            doctorScore: Math.min(5, score + 0.3),
            facilityScore: Math.max(1, score - 0.2),
            recoveryDays: Math.floor(treatment.avgDuration! * (0.8 + Math.random() * 0.6)),
            complicationFlag: Math.random() > 0.92, // 8% chance of complication
            isVerified: true,
          }
        });
        autoReviews++;
      }
    }
  }

  console.log(`✅ Generated ${autoBills} additional Bills and ${autoReviews} additional Patient Reviews`);

  console.log('\n🎉 Database seeded successfully!');
  console.log(`   Hospitals: ${hospitals.length}`);
  console.log(`   Treatments: ${treatments.length}`);
  console.log(`   Hospital-Treatment Mappings: ${htMappings.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());