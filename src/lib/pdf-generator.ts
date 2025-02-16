import { jsPDF } from 'jspdf';
import { PersonalInfo } from '../types';
import { getArrayField, formatArrayField } from './utils';

export function generatePersonalizationPDF(personalInfo: PersonalInfo): Blob {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(24);
  doc.text('Preferences Profile', 20, 20);
  
  let y = 40;
  const lineHeight = 7;
  const indent = 5;

  // Helper function to add a section
  const addSection = (title: string, content: any) => {
    doc.setFontSize(16);
    doc.text(title, 20, y);
    y += lineHeight;
    doc.setFontSize(12);

    if (typeof content === 'string') {
      doc.text(content || 'Not specified', 20 + indent, y);
      y += lineHeight;
    } else if (Array.isArray(content)) {
      if (content.length === 0) {
        doc.text('None specified', 20 + indent, y);
        y += lineHeight;
      } else {
        content.forEach(item => {
          doc.text(`• ${item}`, 20 + indent, y);
          y += lineHeight;
        });
      }
    } else if (typeof content === 'object' && content !== null) {
      Object.entries(content).forEach(([key, value]) => {
        doc.text(`${key}: ${value || 'Not specified'}`, 20 + indent, y);
        y += lineHeight;
      });
    }
    y += lineHeight; // Add space after section
  };

  // Basic Information
  addSection('Basic Information', {
    'Name': personalInfo.name,
    'Email': personalInfo.email,
    'Phone': personalInfo.phone
  });

  // Address
  addSection('Address', personalInfo.address || {
    'Street': '',
    'City': '',
    'State': '',
    'ZIP': '',
    'Country': ''
  });

  // Professional Information
  addSection('Professional Information', {
    'Job': personalInfo.job,
    'Company': personalInfo.company,
    'Projects': personalInfo.projects
  });

  // Check if we need a new page
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Personal Details
  addSection('Personal Details', {
    'Height': personalInfo.height,
    'Weight': personalInfo.weight,
    'Shoe Size': personalInfo.shoe_size,
    'Top Size': personalInfo.clothing_sizes?.top,
    'Bottom Size': personalInfo.clothing_sizes?.bottom
  });

  // Lists
  addSection('Interests & Hobbies', getArrayField(personalInfo.interests));
  addSection('Expertise', getArrayField(personalInfo.expertise));
  addSection('Hobbies', getArrayField(personalInfo.hobbies));
  addSection('Favorite Foods', getArrayField(personalInfo.favorite_foods));
  addSection('Favorite Drinks', getArrayField(personalInfo.favorite_drinks));

  // Check if we need a new page
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Relationships
  addSection('Relationships', {
    'Family': formatArrayField(personalInfo.family) || 'Not specified',
    'Friends': formatArrayField(personalInfo.friends) || 'Not specified',
    'Love Interests': formatArrayField(personalInfo.love_interests) || 'Not specified',
    'Cultural Groups': formatArrayField(personalInfo.cultural_groups) || 'Not specified'
  });

  // Identity
  addSection('Identity & Worldview', {
    'Religion': personalInfo.religion,
    'Worldview': personalInfo.worldview,
    'MBTI Type': personalInfo.mbti
  });

  // Goals & Dreams
  addSection('Goals & Dreams', {
    'Goals': formatArrayField(personalInfo.goals) || 'Not specified',
    'Dreams': formatArrayField(personalInfo.dreams) || 'Not specified'
  });

  // Health
  addSection('Health Information', {
    'Health Concerns': formatArrayField(personalInfo.health_concerns) || 'Not specified'
  });

  // Additional Information
  if (personalInfo.backstory || personalInfo.freeform) {
    doc.addPage();
    y = 20;
    
    if (personalInfo.backstory) {
      addSection('Backstory', personalInfo.backstory);
    }
    
    if (personalInfo.freeform) {
      addSection('Additional Notes', personalInfo.freeform);
    }
  }

  // Keywords
  if (personalInfo.keywords && getArrayField(personalInfo.keywords).length > 0) {
    addSection('Keywords', getArrayField(personalInfo.keywords));
  }

  return doc.output('blob');
}