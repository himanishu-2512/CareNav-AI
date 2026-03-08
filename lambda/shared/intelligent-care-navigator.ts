// Intelligent care navigation using Comprehend Medical + rule-based AI
import { StructuredSymptoms, FollowUpAnswer, DiseaseCandidate } from './types';

export interface DepartmentRecommendation {
  department: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  urgencyLevel?: string; // Human-readable urgency description
  reasoning: string;
  confidence: number;
}

/**
 * Generate department recommendation based on symptoms and answers
 */
export function generateDepartmentRecommendation(
  structuredSymptoms: StructuredSymptoms,
  followUpAnswers: FollowUpAnswer[],
  possibleDiseases: DiseaseCandidate[]
): DepartmentRecommendation {
  const bodyPart = structuredSymptoms.bodyPart.toLowerCase();
  const severity = structuredSymptoms.severity;
  const answerText = followUpAnswers.map(a => a.answer?.toLowerCase() || '').join(' ');
  
  // Check for emergency indicators
  const emergencyIndicators = [
    'chest pain',
    'difficulty breathing',
    'severe bleeding',
    'unconscious',
    'seizure',
    'severe headache with confusion',
    'sudden weakness',
    'slurred speech'
  ];
  
  const hasEmergency = emergencyIndicators.some(indicator => 
    answerText.includes(indicator) || (structuredSymptoms.character && structuredSymptoms.character.toLowerCase().includes(indicator))
  );
  
  if (hasEmergency || severity === 'severe') {
    return {
      department: 'Emergency Medicine',
      urgency: 'emergency',
      urgencyLevel: 'EMERGENCY - Seek immediate medical attention',
      reasoning: 'Your symptoms indicate a potentially serious condition that requires immediate medical attention.',
      confidence: 0.95
    };
  }
  
  // Department mapping based on body part and symptoms
  let department = 'General Medicine';
  let urgency: 'routine' | 'urgent' | 'emergency' = 'routine';
  let reasoning = '';
  let confidence = 0.75;
  
  // Head/Neurological
  if (bodyPart.includes('head') || bodyPart.includes('brain')) {
    if (answerText.includes('vision') || answerText.includes('aura') || answerText.includes('sensitivity')) {
      department = 'Neurology';
      reasoning = 'Your headache symptoms with neurological features suggest evaluation by a neurologist.';
      confidence = 0.85;
    } else {
      department = 'General Medicine';
      reasoning = 'Your headache can be initially evaluated by a general physician.';
      confidence = 0.80;
    }
    
    if (answerText.includes('worse') || answerText.includes('worsening')) {
      urgency = 'urgent';
    }
  }
  
  // Chest/Cardiac
  else if (bodyPart.includes('chest') || bodyPart.includes('heart')) {
    if (answerText.includes('radiating') || answerText.includes('arm') || answerText.includes('jaw') || answerText.includes('sweating')) {
      department = 'Cardiology';
      urgency = 'urgent';
      reasoning = 'Your chest symptoms with concerning features require prompt cardiac evaluation.';
      confidence = 0.90;
    } else if (answerText.includes('breathing') || answerText.includes('cough')) {
      department = 'Pulmonology';
      reasoning = 'Your respiratory symptoms suggest evaluation by a lung specialist.';
      confidence = 0.85;
    } else {
      department = 'General Medicine';
      reasoning = 'Your chest symptoms can be initially evaluated by a general physician.';
      confidence = 0.75;
    }
  }
  
  // Abdomen/Gastro
  else if (bodyPart.includes('abdomen') || bodyPart.includes('stomach')) {
    if (answerText.includes('vomit') || answerText.includes('blood') || answerText.includes('severe')) {
      department = 'Gastroenterology';
      urgency = 'urgent';
      reasoning = 'Your abdominal symptoms with concerning features require prompt gastroenterology evaluation.';
      confidence = 0.88;
    } else {
      department = 'Gastroenterology';
      reasoning = 'Your digestive symptoms suggest evaluation by a gastroenterologist.';
      confidence = 0.82;
    }
  }
  
  // Throat/ENT
  else if (bodyPart.includes('throat') || bodyPart.includes('ear') || bodyPart.includes('nose')) {
    department = 'ENT (Ear, Nose, Throat)';
    reasoning = 'Your symptoms are best evaluated by an ENT specialist.';
    confidence = 0.85;
    
    if (answerText.includes('difficulty swallowing') || answerText.includes('breathing')) {
      urgency = 'urgent';
    }
  }
  
  // Respiratory
  else if (answerText.includes('cough') || answerText.includes('breathing') || answerText.includes('wheezing')) {
    department = 'Pulmonology';
    reasoning = 'Your respiratory symptoms suggest evaluation by a lung specialist.';
    confidence = 0.83;
    
    if (answerText.includes('shortness of breath') || answerText.includes('severe')) {
      urgency = 'urgent';
    }
  }
  
  // Fever/Infection
  else if (answerText.includes('fever') || structuredSymptoms.associatedFactors.some(f => f.toLowerCase().includes('fever'))) {
    if (answerText.includes('high fever') || answerText.includes('persistent')) {
      department = 'Infectious Disease';
      urgency = 'urgent';
      reasoning = 'Your fever pattern suggests evaluation by an infectious disease specialist.';
      confidence = 0.80;
    } else {
      department = 'General Medicine';
      reasoning = 'Your fever can be initially evaluated by a general physician.';
      confidence = 0.78;
    }
  }
  
  // Musculoskeletal
  else if (bodyPart.includes('back') || bodyPart.includes('joint') || bodyPart.includes('muscle') || 
           bodyPart.includes('arm') || bodyPart.includes('leg')) {
    if (answerText.includes('injury') || answerText.includes('accident')) {
      department = 'Orthopedics';
      reasoning = 'Your musculoskeletal symptoms suggest evaluation by an orthopedic specialist.';
      confidence = 0.85;
    } else {
      department = 'General Medicine';
      reasoning = 'Your symptoms can be initially evaluated by a general physician.';
      confidence = 0.75;
    }
  }
  
  // Use disease candidates to refine recommendation
  if (possibleDiseases && possibleDiseases.length > 0) {
    const topDisease = possibleDiseases[0].diseaseName.toLowerCase();
    
    if (topDisease.includes('cardiac') || topDisease.includes('heart')) {
      department = 'Cardiology';
      confidence = Math.min(confidence + 0.10, 0.95);
    } else if (topDisease.includes('gastro') || topDisease.includes('digestive')) {
      department = 'Gastroenterology';
      confidence = Math.min(confidence + 0.10, 0.95);
    } else if (topDisease.includes('respiratory') || topDisease.includes('lung')) {
      department = 'Pulmonology';
      confidence = Math.min(confidence + 0.10, 0.95);
    } else if (topDisease.includes('neuro') || topDisease.includes('migraine')) {
      department = 'Neurology';
      confidence = Math.min(confidence + 0.10, 0.95);
    }
  }
  
  // Add human-readable urgency level
  const urgencyLevel = 
    urgency === 'routine' ? 'ROUTINE - Schedule appointment within 1-2 weeks' :
    urgency === 'urgent' ? 'URGENT - Schedule appointment within 24-48 hours' :
    'EMERGENCY - Seek immediate medical attention';
  
  return {
    department,
    urgency,
    urgencyLevel,
    reasoning,
    confidence
  };
}

/**
 * Get list of nearby doctors for recommended department
 */
export function getNearbyDoctors(department: string, location?: string): any[] {
  // Mock data - in production, this would query a real database
  const doctorDatabase: Record<string, any[]> = {
    'General Medicine': [
      { name: 'Dr. Rajesh Kumar', hospital: 'City General Hospital', distance: '2.5 km', rating: 4.5, available: 'Today' },
      { name: 'Dr. Priya Sharma', hospital: 'Metro Medical Center', distance: '3.1 km', rating: 4.7, available: 'Tomorrow' },
      { name: 'Dr. Amit Patel', hospital: 'Community Health Clinic', distance: '1.8 km', rating: 4.3, available: 'Today' }
    ],
    'Cardiology': [
      { name: 'Dr. Suresh Reddy', hospital: 'Heart Care Institute', distance: '4.2 km', rating: 4.8, available: 'Tomorrow' },
      { name: 'Dr. Anjali Mehta', hospital: 'Cardiac Specialty Center', distance: '5.0 km', rating: 4.9, available: 'Today' }
    ],
    'Gastroenterology': [
      { name: 'Dr. Vikram Singh', hospital: 'Digestive Health Clinic', distance: '3.5 km', rating: 4.6, available: 'Today' },
      { name: 'Dr. Neha Gupta', hospital: 'GI Specialty Hospital', distance: '4.8 km', rating: 4.7, available: 'Tomorrow' }
    ],
    'Neurology': [
      { name: 'Dr. Arun Kumar', hospital: 'Neuro Care Center', distance: '6.2 km', rating: 4.8, available: 'Tomorrow' },
      { name: 'Dr. Kavita Desai', hospital: 'Brain & Spine Institute', distance: '7.1 km', rating: 4.9, available: 'Next Week' }
    ],
    'Pulmonology': [
      { name: 'Dr. Ramesh Iyer', hospital: 'Lung Health Center', distance: '3.8 km', rating: 4.7, available: 'Today' },
      { name: 'Dr. Sunita Rao', hospital: 'Respiratory Clinic', distance: '4.5 km', rating: 4.6, available: 'Tomorrow' }
    ],
    'ENT (Ear, Nose, Throat)': [
      { name: 'Dr. Manoj Verma', hospital: 'ENT Specialty Clinic', distance: '2.9 km', rating: 4.5, available: 'Today' },
      { name: 'Dr. Pooja Nair', hospital: 'Head & Neck Center', distance: '3.7 km', rating: 4.8, available: 'Tomorrow' }
    ],
    'Orthopedics': [
      { name: 'Dr. Sanjay Joshi', hospital: 'Bone & Joint Hospital', distance: '5.5 km', rating: 4.7, available: 'Tomorrow' },
      { name: 'Dr. Rekha Pillai', hospital: 'Orthopedic Center', distance: '6.0 km', rating: 4.6, available: 'Today' }
    ],
    'Emergency Medicine': [
      { name: 'Emergency Department', hospital: 'City General Hospital', distance: '2.5 km', rating: 4.8, available: '24/7' },
      { name: 'Emergency Department', hospital: 'Metro Medical Center', distance: '3.1 km', rating: 4.7, available: '24/7' }
    ]
  };
  
  return doctorDatabase[department] || doctorDatabase['General Medicine'];
}
