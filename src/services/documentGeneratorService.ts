import { supabase } from '@/integrations/supabase/client';
import { Document as DocxDocument, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import PptxGenJS from "pptxgenjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { OpenRouterService } from './openRouterService';

export interface DocumentGenerationOptions {
  content: string;
  type: 'pdf' | 'docx' | 'pptx' | 'markdown' | 'html' | 'xlsx' | 'txt'; // Added 'txt'
  template?: 'report' | 'presentation' | 'letter' | 'resume' | 'contract' | 'stage_report' | 'work_contract' | 'service_contract' | 'rental_contract' | 'motivation_letter' | 'job_application' | 'internship_application' | 'quote' | 'invoice' | 'school_essay' | 'university_thesis' | 'email';
  enhanceWithAI?: boolean;
  model?: string; // OpenRouter model pour amélioration IA
  // New fields for structured document generation
  title?: string;
  author?: string;
  recipient?: string;
  sender?: string;
  company?: string;
  date?: string;
  details?: Record<string, string>; // Generic details for contracts, quotes, etc.
}

/**
 * Service de génération de documents avancé avec OpenRouter
 * Support PDF, DOCX, PPTX, Markdown, HTML, Excel, TXT
 */
export class DocumentGeneratorService {

  /**
   * Génère un document avec amélioration IA optionnelle
   */
  static async generateDocument(options: DocumentGenerationOptions): Promise<string> {
    let { content, type, template, enhanceWithAI = false, model = 'anthropic/claude-3.5-sonnet', ...docDetails } = options;

    console.log('📄 Génération document:', { type, template, enhanceWithAI, docDetails });

    // Amélioration IA du contenu si demandée
    if (enhanceWithAI) {
      content = await this.enhanceContentWithAI(content, type, template, model, docDetails);
    } else if (template) {
      // If no AI enhancement, but a template is provided, generate content based on template
      content = await this.generateContentFromTemplate(content, template, model, docDetails);
    }

    // Génération selon le format
    switch (type) {
      case 'pdf':
        return await this.generatePDF(content, template);
        case 'docx':
          return await this.generateDOCX(content, template, 'A4');
      case 'pptx':
        return await this.generatePPTX(content, template);
      case 'markdown':
        return await this.generateMarkdown(content, template);
      case 'html':
        return await this.generateHTML(content, template);
      case 'xlsx':
        return await this.generateExcel(content);
      case 'txt': // New case for TXT
        return await this.generateTXT(content);
      default:
        throw new Error(`Format non supporté: ${type}`);
    }
  }

  /**
   * Améliore le contenu avec IA via OpenRouter
   */
  private static async enhanceContentWithAI(content: string, type: string, template?: string, model?: string, docDetails?: Record<string, string>): Promise<string> {
    console.log('🤖 Amélioration IA du contenu avec', model);

    const prompt = this.createEnhancementPrompt(content, type, template, docDetails);
    
    try {
      const result = await OpenRouterService.generateWithModel(
        [{ role: 'user', content: prompt }],
        model,
        { temperature: 0.3, max_tokens: 4000 }
      );

      return result.text;
    } catch (error) {
      console.warn('❌ Amélioration IA échouée, utilisation du contenu original:', error);
      return content;
    }
  }

  /**
   * Génère du contenu basé sur un template via l'IA
   */
  private static async generateContentFromTemplate(basePrompt: string, template: string, model?: string, docDetails?: Record<string, string>): Promise<string> {
    console.log('🤖 Génération de contenu à partir du template avec', model);

    const prompt = this.createTemplateGenerationPrompt(basePrompt, template, docDetails);

    try {
      const result = await OpenRouterService.generateWithModel(
        [{ role: 'user', content: prompt }],
        model,
        { temperature: 0.7, max_tokens: 4000 }
      );
      return result.text;
    } catch (error) {
      console.warn('❌ Génération de contenu via template échouée, utilisation du prompt original:', error);
      return basePrompt;
    }
  }

  /**
   * Crée le prompt d'amélioration selon le type de document
   */
  private static createEnhancementPrompt(content: string, type: string, template?: string, docDetails?: Record<string, string>): string {
    const basePrompt = `Improve and structure the following content for a professional ${type.toUpperCase()} document`;
    
    const templateInstructions = {
      report: 'as a formal business report with executive summary, findings, and recommendations',
      presentation: 'as engaging presentation slides with clear headings and bullet points',
      letter: 'as a professional business letter with proper formatting',
      resume: 'as a professional resume with clear sections and achievements',
      contract: 'as a legal contract with proper clauses and terms',
      stage_report: 'as a detailed internship report, including context, missions, achievements, and conclusion',
      work_contract: 'as a standard employment contract, including parties, terms, and conditions',
      service_contract: 'as a service agreement, outlining scope, deliverables, and payment terms',
      rental_contract: 'as a residential lease agreement, covering property details, rent, and tenant/landlord obligations',
      motivation_letter: 'as a compelling cover letter, highlighting skills and motivation for a specific role',
      job_application: 'as a professional job application letter, tailored to a job offer',
      internship_application: 'as an internship application letter, emphasizing learning objectives and skills',
      quote: 'as a detailed commercial quote, including itemized services/products, prices, and total',
      invoice: 'as a professional invoice, with itemized services/products, amounts, taxes, and payment due date',
      school_essay: 'as a well-structured school essay, with introduction, body paragraphs, and conclusion',
      university_thesis: 'as an academic university thesis/dissertation chapter, with research, analysis, and citations',
      email: 'as a professional email, with clear subject, greeting, body, and call to action'
    };

    const typeInstructions = {
      pdf: 'Optimize for PDF format with clear headings and structured paragraphs.',
      docx: 'Format for Word document with proper headings and formatting.',
      pptx: 'Structure as presentation slides with concise, impactful content.',
      markdown: 'Format using proper Markdown syntax with headers, lists, and emphasis.',
      html: 'Create semantic HTML with proper tags and structure.',
      xlsx: 'Structure as spreadsheet data with clear columns and rows.',
      txt: 'Format as plain text, ensuring readability and clear paragraph breaks.'
    };

    let enhancedPrompt = basePrompt;
    
    if (template && templateInstructions[template as keyof typeof templateInstructions]) {
      enhancedPrompt += ` ${templateInstructions[template as keyof typeof templateInstructions]}`;
    }
    
    enhancedPrompt += ` ${typeInstructions[type as keyof typeof typeInstructions]}`;
    enhancedPrompt += `\n\nOriginal content:\n${content}\n\nImproved version:`;

    return enhancedPrompt;
  }

  /**
   * Crée le prompt de génération de contenu à partir d'un template
   */
  private static createTemplateGenerationPrompt(basePrompt: string, template: string, docDetails?: Record<string, string>): string {
    let prompt = `Génère un document de type "${template}" en français.`;

    switch (template) {
      case 'stage_report':
        prompt += `\n\nSujet du rapport de stage: ${basePrompt}.`;
        if (docDetails?.company) prompt += ` Entreprise: ${docDetails.company}.`;
        if (docDetails?.period) prompt += ` Période: ${docDetails.period}.`;
        if (docDetails?.missions) prompt += ` Missions principales: ${docDetails.missions}.`;
        prompt += `\nLe rapport doit inclure une introduction, le contexte de l'entreprise, les missions réalisées, les compétences acquises et une conclusion.`;
        break;
      case 'work_contract':
        prompt += `\n\nType de contrat de travail: ${basePrompt}.`;
        if (docDetails?.employeeName) prompt += ` Nom de l'employé: ${docDetails.employeeName}.`;
        if (docDetails?.employerName) prompt += ` Nom de l'employeur: ${docDetails.employerName}.`;
        if (docDetails?.position) prompt += ` Poste: ${docDetails.position}.`;
        if (docDetails?.salary) prompt += ` Salaire: ${docDetails.salary}.`;
        prompt += `\nLe contrat doit inclure les informations sur les parties, le poste, la rémunération, la durée et les conditions générales.`;
        break;
      case 'service_contract':
        prompt += `\n\nObjet du contrat de prestation: ${basePrompt}.`;
        if (docDetails?.clientName) prompt += ` Nom du client: ${docDetails.clientName}.`;
        if (docDetails?.providerName) prompt += ` Nom du prestataire: ${docDetails.providerName}.`;
        if (docDetails?.services) prompt += ` Services: ${docDetails.services}.`;
        if (docDetails?.price) prompt += ` Prix: ${docDetails.price}.`;
        prompt += `\nLe contrat doit détailler les services, les livrables, les délais et les modalités de paiement.`;
        break;
      case 'rental_contract':
        prompt += `\n\nObjet du contrat de location: ${basePrompt}.`;
        if (docDetails?.landlord) prompt += ` Propriétaire: ${docDetails.landlord}.`;
        if (docDetails?.tenant) prompt += ` Locataire: ${docDetails.tenant}.`;
        if (docDetails?.address) prompt += ` Adresse du bien: ${docDetails.address}.`;
        if (docDetails?.rent) prompt += ` Loyer mensuel: ${docDetails.rent}.`;
        prompt += `\nLe contrat doit inclure les détails du bien, le montant du loyer, la durée et les obligations des parties.`;
        break;
      case 'motivation_letter':
        prompt += `\n\nObjet de la lettre de motivation: ${basePrompt}.`;
        if (docDetails?.jobTitle) prompt += ` Poste visé: ${docDetails.jobTitle}.`;
        if (docDetails?.company) prompt += ` Entreprise: ${docDetails.company}.`;
        if (docDetails?.skills) prompt += ` Compétences clés: ${docDetails.skills}.`;
        prompt += `\nLa lettre doit être percutante, mettre en avant les motivations et les compétences du candidat.`;
        break;
      case 'job_application':
        prompt += `\n\nObjet de la demande d'emploi: ${basePrompt}.`;
        if (docDetails?.jobTitle) prompt += ` Poste: ${docDetails.jobTitle}.`;
        if (docDetails?.company) prompt += ` Entreprise: ${docDetails.company}.`;
        prompt += `\nLa demande doit être formelle et adaptée à une offre d'emploi spécifique.`;
        break;
      case 'internship_application':
        prompt += `\n\nObjet de la demande de stage: ${basePrompt}.`;
        if (docDetails?.company) prompt += ` Entreprise: ${docDetails.company}.`;
        if (docDetails?.period) prompt += ` Période: ${docDetails.period}.`;
        prompt += `\nLa demande doit mettre en avant les objectifs d'apprentissage et les compétences.`;
        break;
      case 'quote':
        prompt += `\n\nObjet du devis: ${basePrompt}.`;
        if (docDetails?.clientName) prompt += ` Client: ${docDetails.clientName}.`;
        if (docDetails?.items) prompt += ` Articles/Services: ${docDetails.items}.`;
        prompt += `\nLe devis doit être détaillé avec les prix unitaires, la quantité, le total HT et TTC.`;
        break;
      case 'invoice':
        prompt += `\n\nObjet de la facture: ${basePrompt}.`;
        if (docDetails?.clientName) prompt += ` Client: ${docDetails.clientName}.`;
        if (docDetails?.items) prompt += ` Articles/Services: ${docDetails.items}.`;
        prompt += `\nLa facture doit inclure les détails de la prestation, les montants, les taxes et la date d'échéance.`;
        break;
      case 'school_essay':
        prompt += `\n\nSujet de l'exposé scolaire: ${basePrompt}.`;
        if (docDetails?.level) prompt += ` Niveau scolaire: ${docDetails.level}.`;
        prompt += `\nL'exposé doit être structuré avec introduction, développement et conclusion.`;
        break;
      case 'university_thesis':
        prompt += `\n\nSujet de la thèse/mémoire: ${basePrompt}.`;
        if (docDetails?.field) prompt += ` Domaine d'étude: ${docDetails.field}.`;
        prompt += `\nLe contenu doit être académique, inclure une problématique, une méthodologie, une analyse et une bibliographie.`;
        break;
      case 'email':
        prompt += `\n\nObjet de l'e-mail: ${basePrompt}.`;
        if (docDetails?.subject) prompt += ` Sujet: ${docDetails.subject}.`;
        if (docDetails?.recipient) prompt += ` Destinataire: ${docDetails.recipient}.`;
        prompt += `\nL'e-mail doit être professionnel, clair et concis.`;
        break;
      default:
        prompt += `\n\nContenu principal: ${basePrompt}.`;
        break;
    }

    prompt += `\n\nRéponds uniquement avec le contenu du document, sans introduction ni conclusion supplémentaires. Utilise le format Markdown pour une structure claire.`;
    return prompt;
  }

  /**
   * Génère un PDF avec templates avancés
   */
  private static async generatePDF(content: string, template?: string): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let currentPage = pdfDoc.addPage();
    const { width, height } = currentPage.getSize();
    const margin = 50;
    let y = height - margin;

    // En-tête selon le template
    if (template === 'report') {
      y = await this.addReportHeader(currentPage, boldFont, font, y, margin, width);
    } else if (template === 'letter') {
      y = await this.addLetterHeader(currentPage, boldFont, y, margin);
    }

    // Contenu principal
    const lines = this.wrapText(content, Math.floor((width - 2 * margin) / 6));
    
    for (const line of lines) {
      if (y < margin + 20) {
        currentPage = pdfDoc.addPage();
        y = height - margin;
      }
      
      const isHeading = line.match(/^#{1,3}\s/) || line.match(/^[A-Z][A-Z\s]+:$/);
      const fontSize = isHeading ? 14 : 12;
      const selectedFont = isHeading ? boldFont : font;
      
      currentPage.drawText(line || " ", { 
        x: margin, 
        y, 
        size: fontSize, 
        font: selectedFont,
        color: rgb(0, 0, 0)
      });
      
      y -= fontSize * 1.4;
    }

    return await pdfDoc.saveAsBase64({ dataUri: true });
  }

  /**
   * Génère un DOCX avec formatage avancé et templates A4/A5
   */
  private static async generateDOCX(content: string, template?: string, pageSize: 'A4' | 'A5' = 'A4'): Promise<string> {
    const paragraphs: any[] = [];

    // Auto-générer une table des matières
    const tableOfContents = this.generateTableOfContents(content);
    
    // Page de titre
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: content.match(/^# (.+)$/m)?.[1] || "Ebook", bold: true, size: 36 })],
        heading: HeadingLevel.TITLE,
        alignment: 'center'
      })
    );
    
    paragraphs.push(new Paragraph({ text: "" })); // Espace
    
    // Ajouter l'avant-propos s'il existe
    if (content.includes('## Avant-propos') || content.includes('# Avant-propos')) {
      paragraphs.push(new Paragraph({ text: "" }));
    }
    
    // Table des matières
    if (tableOfContents.length > 0) {
      paragraphs.push(new Paragraph({ text: "" }));
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "Table des matières", bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_1,
          alignment: 'center'
        })
      );
      paragraphs.push(new Paragraph({ text: "" }));
      
      tableOfContents.forEach(item => {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `${'  '.repeat(item.level - 1)}${item.title}`, size: 14 - item.level })],
          })
        );
      });
      
      paragraphs.push(new Paragraph({ text: "" }));
    }

    // Contenu structuré
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim() === '') {
        paragraphs.push(new Paragraph({ text: "" }));
        continue;
      }

      // Détection des titres
      if (line.match(/^#{1,3}\s/)) {
        const level = line.match(/^#{1,3}/)?.[0].length || 1;
        const text = line.replace(/^#{1,3}\s/, '');
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text, bold: true, size: 24 - (level * 2) })],
            heading: level === 1 ? HeadingLevel.HEADING_1 : 
                     level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3
          })
        );
      } else {
        paragraphs.push(new Paragraph({ text: line }));
      }
    }

    const doc = new DocxDocument({
      sections: [{
        properties: {
          page: {
            size: {
              width: pageSize === 'A5' ? 5906 : 8391, // A5: 148mm, A4: 210mm (in twentieths of a point)
              height: pageSize === 'A5' ? 8391 : 11906, // A5: 210mm, A4: 297mm
            },
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: paragraphs
      }]
    });

    const base64 = await Packer.toBase64String(doc);
    return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`;
  }

  /**
   * Génère un PPTX avec templates de présentation
   */
  private static async generatePPTX(content: string, template?: string): Promise<string> {
    const pptx = new PptxGenJS();
    
    // Configuration du template
    if (template === 'presentation') {
      pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
    } else {
      pptx.defineLayout({ name: 'A4', width: 10, height: 7.5 });
    }

    // Diviser le contenu en slides
    const slides = this.contentToSlides(content);
    
    for (let i = 0; i < slides.length; i++) {
      const slide = pptx.addSlide();
      const slideContent = slides[i];
      
      // Titre de slide
      if (slideContent.title) {
        slide.addText(slideContent.title, {
          x: 0.5, y: 0.5, w: 9, h: 1,
          fontSize: 24, bold: true, color: '1f4788'
        });
      }
      
      // Contenu
      slide.addText(slideContent.content, {
        x: 0.5, y: slideContent.title ? 1.5 : 0.5,
        w: 9, h: slideContent.title ? 5 : 6,
        fontSize: 16, align: 'left', valign: 'top'
      });
      
      // Numéro de page
      slide.addText(`${i + 1} / ${slides.length}`, {
        x: 8.5, y: 6.5, w: 1, h: 0.5,
        fontSize: 12, color: '666666'
      });
    }

    const base64 = await pptx.write({ outputType: "base64" });
    return `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${base64}`;
  }

  /**
   * Génère du Markdown structuré
   */
  private static async generateMarkdown(content: string, template?: string): Promise<string> {
    let markdown = content;
    
    // Amélioration du formatage Markdown
    if (template === 'report') {
      markdown = `# Rapport d'Analyse\n\n## Résumé Exécutif\n\n${content}\n\n---\n\n*Généré automatiquement par Chatelix*`;
    } else if (template === 'readme') {
      markdown = `# Projet\n\n## Description\n\n${content}\n\n## Installation\n\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Usage\n\nÀ compléter\n`;
    }
    
    const base64 = btoa(unescape(encodeURIComponent(markdown)));
    return `data:text/markdown;base64,${base64}`;
  }

  /**
   * Génère du HTML sémantique
   */
  private static async generateHTML(content: string, template?: string): Promise<string> {
    const lines = content.split('\n');
    let html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document généré</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
        h1, h2, h3 { color: #2563eb; }
        h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
        p { margin-bottom: 1rem; }
        .highlight { background-color: #fef3c7; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
    </style>
</head>
<body>`;

    for (const line of lines) {
      if (line.match(/^#{1,3}\s/)) {
        const level = line.match(/^#{1,3}/)?.[0].length || 1;
        const text = line.replace(/^#{1,3}\s/, '');
        html += `<h${level}>${text}</h${level}>\n`;
      } else if (line.trim()) {
        html += `<p>${line}</p>\n`;
      }
    }

    html += `
</body>
</html>`;

    const base64 = btoa(unescape(encodeURIComponent(html)));
    return `data:text/html;base64,${base64}`;
  }

  /**
   * Génère un Excel avec données structurées
   */
  private static async generateExcel(content: string): Promise<string> {
    // Pour l'instant, créer un CSV simple
    // Dans une vraie implémentation, utiliser une lib comme xlsx
    const lines = content.split('\n').filter(line => line.trim());
    const csv = lines.map(line => `"${line.replace(/"/g, '""')}"`).join('\n');
    
    const base64 = btoa(unescape(encodeURIComponent(csv)));
    return `data:application/vnd.ms-excel;base64,${base64}`;
  }

  /**
   * Génère un fichier texte brut
   */
  private static async generateTXT(content: string): Promise<string> {
    const base64 = btoa(unescape(encodeURIComponent(content)));
    return `data:text/plain;base64,${base64}`;
  }

  // Méthodes utilitaires

  private static wrapText(text: string, maxWidth = 90): string[] {
    return text.split(/\r?\n/).flatMap((line) => {
      if (line.length <= maxWidth) return [line];
      
      const chunks: string[] = [];
      let current = line;
      while (current.length > maxWidth) {
        chunks.push(current.slice(0, maxWidth));
        current = current.slice(maxWidth);
      }
      chunks.push(current);
      return chunks;
    });
  }

  private static contentToSlides(content: string): Array<{ title?: string; content: string }> {
    const lines = content.split('\n');
    const slides: Array<{ title?: string; content: string }> = [];
    let currentSlide: { title?: string; content: string } = { content: '' };

    for (const line of lines) {
      if (line.match(/^#{1,2}\s/)) {
        // Nouveau slide avec titre
        if (currentSlide.content.trim()) {
          slides.push(currentSlide);
        }
        currentSlide = {
          title: line.replace(/^#{1,2}\s/, ''),
          content: ''
        };
      } else if (line.trim() === '---') {
        // Séparateur de slide
        if (currentSlide.content.trim() || currentSlide.title) {
          slides.push(currentSlide);
        }
        currentSlide = { content: '' };
      } else {
        currentSlide.content += line + '\n';
      }
    }

    if (currentSlide.content.trim() || currentSlide.title) {
      slides.push(currentSlide);
    }

    return slides.length > 0 ? slides : [{ content }];
  }

  private static async addReportHeader(page: any, boldFont: any, font: any, y: number, margin: number, width: number): Promise<number> {
    page.drawText('RAPPORT D\'ANALYSE', {
      x: margin, y, size: 18, font: boldFont, color: rgb(0, 0, 0)
    });
    y -= 30;
    
    page.drawText(`Date: ${new Date().toLocaleDateString('fr-FR')}`, {
      x: width - margin - 100, y: y + 20, size: 10, font: font, color: rgb(0.5, 0.5, 0.5)
    });
    
    return y - 20;
  }

  private static async addLetterHeader(page: any, boldFont: any, y: number, margin: number): Promise<number> {
    const date = new Date().toLocaleDateString('fr-FR', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    page.drawText(date, {
      x: margin, y, size: 12, font: boldFont, color: rgb(0, 0, 0)
    });
    
    return y - 40;
  }

  private static generateTableOfContents(content: string): Array<{ title: string; level: number }> {
    const toc: Array<{ title: string; level: number }> = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2];
        // Skip main title
        if (level > 1 || !title.match(/^[A-Z][a-z\s]+$/)) {
          toc.push({ title, level });
        }
      }
    }
    
    return toc;
  }
}