document.addEventListener('DOMContentLoaded', function() {
    const searchBtn = document.getElementById('search-btn');
    const studentIdInput = document.getElementById('student-id');
    const loadingEl = document.getElementById('loading');
    const resultEl = document.getElementById('result');
    const errorMessageEl = document.getElementById('error-message');
    
    // API configuration
    const API_KEY = 'f73a0a2287c30a2cb731c1fc0b8aa57fa1767217a4a93e4e7a67bd7e39232cae';
    const API_ID = '252356e7fece639c6b31997d8a04e3e9-9f34f72d8ab785e8dd12ba65fa32bbb3';
    const BASE_URL = 'https://apivt.iut-orsay.fr/api';
    
    // Animation des nombres
    function animateCounter(element, target) {
        const duration = 1500;
        const frameDuration = 1000/60;
        const totalFrames = Math.round(duration / frameDuration);
        let frame = 0;
        const start = parseInt(element.textContent) || 0;
        const increment = (target - start) / totalFrames;
        
        const animate = () => {
            frame++;
            const current = Math.round(start + increment * frame);
            element.textContent = current;
            
            if (frame < totalFrames) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = target;
            }
        };
        
        animate();
    }
    
    // Tabs functionality
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show corresponding tab content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Convert minutes to readable time format (8h00, 18h15, etc.)
    function minutesToTimeString(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h${mins.toString().padStart(2, '0')}`;
    }
    
    // Calculate duration between two times in minutes
    function calculateDuration(startMinutes, endMinutes) {
        return endMinutes - startMinutes;
    }
    
    // Format duration in hours and minutes
    function formatDuration(durationMinutes) {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        
        if (hours === 0) {
            return `${minutes} minutes`;
        } else if (minutes === 0) {
            return `${hours} heure${hours > 1 ? 's' : ''}`;
        } else {
            return `${hours}h${minutes.toString().padStart(2, '0')}`;
        }
    }
    
    // Add a row to a table
    function addRowToTable(table, absence) {
        const tbody = table.querySelector('tbody');
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(absence.dateDebut);
        
        const heureDebutCell = document.createElement('td');
        heureDebutCell.textContent = minutesToTimeString(absence.heureDebut);
        
        const heureFinCell = document.createElement('td');
        heureFinCell.textContent = minutesToTimeString(absence.heureFin);
        
        const dureeCell = document.createElement('td');
        const duree = calculateDuration(absence.heureDebut, absence.heureFin);
        dureeCell.textContent = formatDuration(duree);
        
        const statutCell = document.createElement('td');
        if (absence.justifiee === 1) {
            statutCell.textContent = 'Justifiée';
            statutCell.className = 'justifiee';
        } else {
            statutCell.textContent = 'Non justifiée';
            statutCell.className = 'non-justifiee';
        }
        
        const commentaireCell = document.createElement('td');
        commentaireCell.textContent = absence.commentaire || '-';
        
        row.appendChild(dateCell);
        row.appendChild(heureDebutCell);
        row.appendChild(heureFinCell);
        row.appendChild(dureeCell);
        row.appendChild(statutCell);
        row.appendChild(commentaireCell);
        
        tbody.appendChild(row);
        
        return duree;
    }
    
    // Format date (yyyy-mm-dd to dd/mm/yyyy)
    function formatDate(dateStr) {
        const parts = dateStr.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    // Clear all tables
    function clearTables() {
        document.querySelectorAll('table tbody').forEach(tbody => {
            tbody.innerHTML = '';
        });
    }
    
    // Search button click handler
    searchBtn.addEventListener('click', async function() {
        const studentId = studentIdInput.value.trim();
        
        if (!studentId) {
            showError('Veuillez entrer votre identifiant étudiant.');
            return;
        }
        
        // Show loading, hide results and error
        loadingEl.style.display = 'block';
        resultEl.style.display = 'none';
        errorMessageEl.style.display = 'none';
        clearTables();
        
        try {
            // First, get the student code
            const codeEtudiant = await getCodeEtudiant(studentId);
            
            // Then, get absences with the student code
            const absences = await getAbsences(codeEtudiant);
            
            // Process and display results
            displayResults(absences);
        } catch (error) {
            showError(error.message);
        } finally {
            loadingEl.style.display = 'none';
        }
    });
    
    // Fetch student code from API
    async function getCodeEtudiant(studentId) {
        const url = `${BASE_URL}/etudiants/${studentId}/code-etudiant`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'X-API-KEY': API_KEY,
                'X-API-ID': API_ID
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération du code étudiant. Vérifiez votre identifiant.`);
        }
        
        const data = await response.json();
        return data;
    }
    
    // Fetch absences from API
    async function getAbsences(codeEtudiant) {
        const url = `${BASE_URL}/etudiants/${codeEtudiant}/absences`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'X-API-KEY': API_KEY,
                'X-API-ID': API_ID
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des absences.`);
        }
        
        const data = await response.json();
        return data;
    }
    
    // Display results in the UI
    function displayResults(absences) {
        if (!absences || absences.length === 0) {
            showError('Aucune absence trouvée pour cet étudiant.');
            return;
        }
        
        // Get student info from the first absence
        const studentName = absences[0].nomEtudiant;
        const studentFirstname = absences[0].prenomEtudiant;
        const studentCode = absences[0].codeEtudiant;
        
        // Update student info
        document.getElementById('student-name').textContent = studentName;
        document.getElementById('student-firstname').textContent = studentFirstname;
        document.getElementById('student-code').textContent = studentCode;
        
        // Filter absences by type
        const absencesType1 = absences.filter(a => a.typeAbsence === 1 && a.deleted === 0);
        const absencesType2 = absences.filter(a => a.typeAbsence === 2 && a.deleted === 0);
        const absencesType3 = absences.filter(a => a.typeAbsence === 3 && a.deleted === 0);
        
        // Fill tables
        const absencesTable = document.getElementById('absences-table');
        let totalAbsenceMinutes = 0;
        
        absencesType1.forEach(absence => {
            const duration = addRowToTable(absencesTable, absence);
            totalAbsenceMinutes += duration;
        });
        
        const retardsTable = document.getElementById('retards-table');
        absencesType2.forEach(absence => {
            addRowToTable(retardsTable, absence);
        });
        
        const exclusionsTable = document.getElementById('exclusions-table');
        absencesType3.forEach(absence => {
            addRowToTable(exclusionsTable, absence);
        });
        
        // Update total absence hours
        document.getElementById('absence-hours').textContent = formatDuration(totalAbsenceMinutes);
        
        // Show results
        resultEl.style.display = 'block';
        
        // Animate counters
        setTimeout(() => {
            animateCounter(document.getElementById('absence-count'), absencesType1.length);
            animateCounter(document.getElementById('retard-count'), absencesType2.length);
            animateCounter(document.getElementById('exclusion-count'), absencesType3.length);
        }, 300);
    }
    
    // Show error message
    function showError(message) {
        errorMessageEl.textContent = message;
        errorMessageEl.style.display = 'block';
        loadingEl.style.display = 'none';
        resultEl.style.display = 'none';
    }
});