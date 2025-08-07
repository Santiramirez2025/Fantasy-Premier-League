// Fantasy Premier League Live Application
class FantasyPremierLeague {
    constructor() {
        // API Configuration - Updated for 2025-26 season
        this.apiKey = 'YOUR_API_KEY_HERE'; // Get free at football-data.org
        this.baseUrl = 'https://api.football-data.org/v4';
        this.premierLeagueId = 2021;
        this.currentSeason = '2025-26';
        this.seasonStartDate = '2025-08-15'; // Friday, August 15, 2025
        this.seasonEndDate = '2026-05-24';   // Sunday, May 24, 2026
        
        // App State
        this.players = [
            {
                id: 1,
                name: "Ashley",
                avatar: "A",
                score: 0,
                teams: [],
                weeklyPoints: 0,
                achievements: []
            },
            {
                id: 2,
                name: "Aaron",
                avatar: "AA",
                score: 0,
                teams: [],
                weeklyPoints: 0,
                achievements: []
            },
            {
                id: 3,
                name: "Steve",
                avatar: "S",
                score: 0,
                teams: [],
                weeklyPoints: 0,
                achievements: []
            },
            {
                id: 4,
                name: "Phil",
                avatar: "P",
                score: 0,
                teams: [],
                weeklyPoints: 0,
                achievements: []
            }
        ];

        // Premier League teams for 2025-26 season (projected)
        this.premierLeagueTeams = [
            { name: "Manchester City", value: 1000, expectedPosition: 1, id: 65 },
            { name: "Arsenal", value: 950, expectedPosition: 2, id: 57 },
            { name: "Liverpool", value: 920, expectedPosition: 3, id: 64 },
            { name: "Chelsea", value: 850, expectedPosition: 4, id: 61 },
            { name: "Tottenham Hotspur", value: 750, expectedPosition: 5, id: 73 },
            { name: "Manchester United", value: 700, expectedPosition: 6, id: 66 },
            { name: "Newcastle United", value: 650, expectedPosition: 7, id: 67 },
            { name: "Aston Villa", value: 600, expectedPosition: 8, id: 58 },
            { name: "Brighton & Hove Albion", value: 520, expectedPosition: 9, id: 397 },
            { name: "West Ham United", value: 450, expectedPosition: 10, id: 563 },
            { name: "Crystal Palace", value: 400, expectedPosition: 11, id: 354 },
            { name: "Fulham", value: 420, expectedPosition: 12, id: 63 },
            { name: "Wolverhampton Wanderers", value: 350, expectedPosition: 13, id: 76 },
            { name: "Everton", value: 320, expectedPosition: 14, id: 62 },
            { name: "Brentford", value: 380, expectedPosition: 15, id: 402 },
            { name: "Nottingham Forest", value: 300, expectedPosition: 16, id: 351 },
            { name: "AFC Bournemouth", value: 320, expectedPosition: 17, id: 1044 },
            // Projected promoted teams for 2025-26 (TBD based on 2024-25 results)
            { name: "Leeds United", value: 280, expectedPosition: 18, id: 341, promoted: true },
            { name: "Burnley", value: 250, expectedPosition: 19, id: 328, promoted: true },
            { name: "Sheffield United", value: 240, expectedPosition: 20, id: 356, promoted: true }
        ];

        this.currentPlayerIndex = 0;
        this.currentWeek = this.getCurrentGameweek();
        this.updateInterval = 30000; // 30 seconds
        this.autoRefreshEnabled = true;
        
        // Data storage
        this.matches = [];
        this.standings = [];
        this.scorers = [];
        
        this.init();
    }

    getCurrentGameweek() {
        const seasonStart = new Date('2025-08-15'); // Friday, August 15, 2025
        const now = new Date();
        
        // If season hasn't started yet
        if (now < seasonStart) {
            return 0; // Pre-season
        }
        
        const daysDiff = Math.floor((now - seasonStart) / (1000 * 60 * 60 * 24));
        
        // Each gameweek is roughly 7 days, starting from week 1
        return Math.max(1, Math.floor(daysDiff / 7) + 1);
    }

    isSeasonStarted() {
        const seasonStart = new Date('2025-08-15');
        const now = new Date();
        return now >= seasonStart;
    }

    getDaysUntilSeason() {
        const seasonStart = new Date('2025-08-15');
        const now = new Date();
        
        if (now >= seasonStart) {
            return 0;
        }
        
        return Math.ceil((seasonStart - now) / (1000 * 60 * 60 * 24));
    }

    async init() {
        try {
            this.loadData();
            this.setupEventListeners();
            await this.fetchInitialData();
            this.render();
            this.startAutoUpdate();
            this.updateConnectionStatus('connected', 'Connected');
        } catch (error) {
            console.error('Error initializing app:', error);
            this.updateConnectionStatus('error', 'Connection Error');
            this.showNotification('Error', 'Could not connect to API', 'error');
            this.loadSampleData();
            this.render();
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Auto refresh toggle
        const autoRefreshCheckbox = document.getElementById('autoRefresh');
        if (autoRefreshCheckbox) {
            autoRefreshCheckbox.addEventListener('change', (e) => {
                this.autoRefreshEnabled = e.target.checked;
            });
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    async fetchInitialData() {
        try {
            await Promise.all([
                this.fetchMatches(),
                this.fetchStandings(),
                this.fetchTopScorers()
            ]);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            this.loadSampleData();
        }
    }

    async fetchMatches() {
        try {
            if (this.apiKey === 'YOUR_API_KEY_HERE') {
                throw new Error('API key not configured');
            }

            // Fetch current matchday first
            const matchdayResponse = await fetch(`${this.baseUrl}/competitions/${this.premierLeagueId}`, {
                headers: {
                    'X-Auth-Token': this.apiKey
                }
            });

            let currentMatchday = this.currentWeek;
            if (matchdayResponse.ok) {
                const competitionData = await matchdayResponse.json();
                currentMatchday = competitionData.currentSeason?.currentMatchday || this.currentWeek;
            }

            // Fetch matches for current matchday and next few days
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            
            const dateFrom = today.toISOString().split('T')[0];
            const dateTo = nextWeek.toISOString().split('T')[0];

            const response = await fetch(`${this.baseUrl}/competitions/${this.premierLeagueId}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
                headers: {
                    'X-Auth-Token': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            this.matches = data.matches || [];
            
            // Also fetch current matchday matches if different
            if (this.matches.length < 5) {
                const matchdayResponse = await fetch(`${this.baseUrl}/competitions/${this.premierLeagueId}/matches?matchday=${currentMatchday}`, {
                    headers: {
                        'X-Auth-Token': this.apiKey
                    }
                });
                
                if (matchdayResponse.ok) {
                    const matchdayData = await matchdayResponse.json();
                    // Merge unique matches
                    const existingIds = this.matches.map(m => m.id);
                    const newMatches = matchdayData.matches.filter(m => !existingIds.includes(m.id));
                    this.matches = [...this.matches, ...newMatches];
                }
            }

        } catch (error) {
            console.error('Error fetching matches:', error);
            this.matches = this.generateSampleMatches();
        }
    }

    async fetchStandings() {
        try {
            if (this.apiKey === 'YOUR_API_KEY_HERE') {
                throw new Error('API key not configured');
            }

            const response = await fetch(`${this.baseUrl}/competitions/${this.premierLeagueId}/standings`, {
                headers: {
                    'X-Auth-Token': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            this.standings = data.standings[0]?.table || [];
        } catch (error) {
            console.error('Error fetching standings:', error);
            this.standings = this.generateSampleStandings();
        }
    }

    async fetchTopScorers() {
        try {
            if (this.apiKey === 'YOUR_API_KEY_HERE') {
                throw new Error('API key not configured');
            }

            const response = await fetch(`${this.baseUrl}/competitions/${this.premierLeagueId}/scorers`, {
                headers: {
                    'X-Auth-Token': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            this.scorers = data.scorers || [];
        } catch (error) {
            console.error('Error fetching scorers:', error);
            this.scorers = this.generateSampleScorers();
        }
    }

    loadSampleData() {
        this.matches = this.generateSampleMatches();
        this.standings = this.generateSampleStandings();
        this.scorers = this.generateSampleScorers();
        
        // If season hasn't started, set initial scores to 0
        if (!this.isSeasonStarted()) {
            this.players.forEach(player => {
                player.score = 0;
                player.weeklyPoints = 0;
                player.achievements = [];
            });
            
            // Sample team selections for demonstration
            this.players[0].teams = ["Manchester City", "Arsenal", "Brighton & Hove Albion", "Fulham", "Brentford"];
            this.players[1].teams = ["Liverpool", "Chelsea", "Aston Villa", "Crystal Palace", "Wolverhampton Wanderers"];
            this.players[2].teams = ["Manchester United", "Tottenham Hotspur", "West Ham United", "AFC Bournemouth", "Everton"];
            this.players[3].teams = ["Newcastle United", "Nottingham Forest", "Leeds United", "Burnley", "Sheffield United"];
        } else {
            // Load sample player data for active season
            this.players[0].score = 45;
            this.players[0].weeklyPoints = 12;
            this.players[0].teams = ["Manchester City", "Arsenal", "Brighton & Hove Albion", "Fulham", "Brentford"];

            this.players[1].score = 38;
            this.players[1].weeklyPoints = 8;
            this.players[1].teams = ["Liverpool", "Chelsea", "Aston Villa", "Crystal Palace", "Wolverhampton Wanderers"];

            this.players[2].score = 32;
            this.players[2].weeklyPoints = 15;
            this.players[2].teams = ["Manchester United", "Tottenham Hotspur", "West Ham United", "AFC Bournemouth", "Everton"];

            this.players[3].score = 28;
            this.players[3].weeklyPoints = 6;
            this.players[3].teams = ["Newcastle United", "Nottingham Forest", "Leeds United", "Burnley", "Sheffield United"];
            this.players[3].achievements = ["Promoted Team Support"];
        }
    }

    generateSampleMatches() {
        // If season hasn't started, return empty array
        if (!this.isSeasonStarted()) {
            return [];
        }

        const matches = [];
        const now = new Date();
        
        // Only generate matches if season has started
        // Live matches
        for (let i = 0; i < 2; i++) {
            const homeTeam = this.premierLeagueTeams[Math.floor(Math.random() * this.premierLeagueTeams.length)];
            let awayTeam = this.premierLeagueTeams[Math.floor(Math.random() * this.premierLeagueTeams.length)];
            while (awayTeam.name === homeTeam.name) {
                awayTeam = this.premierLeagueTeams[Math.floor(Math.random() * this.premierLeagueTeams.length)];
            }
            
            matches.push({
                id: i,
                homeTeam: { name: homeTeam.name },
                awayTeam: { name: awayTeam.name },
                score: {
                    fullTime: {
                        home: Math.floor(Math.random() * 3),
                        away: Math.floor(Math.random() * 3)
                    }
                },
                status: 'IN_PLAY',
                minute: Math.floor(Math.random() * 90) + 1,
                utcDate: new Date(now.getTime() - Math.random() * 3600000).toISOString()
            });
        }

        // Scheduled matches for next few days
        for (let i = 2; i < 6; i++) {
            const homeTeam = this.premierLeagueTeams[Math.floor(Math.random() * this.premierLeagueTeams.length)];
            let awayTeam = this.premierLeagueTeams[Math.floor(Math.random() * this.premierLeagueTeams.length)];
            while (awayTeam.name === homeTeam.name) {
                awayTeam = this.premierLeagueTeams[Math.floor(Math.random() * this.premierLeagueTeams.length)];
            }
            
            matches.push({
                id: i,
                homeTeam: { name: homeTeam.name },
                awayTeam: { name: awayTeam.name },
                score: { fullTime: { home: null, away: null } },
                status: 'SCHEDULED',
                utcDate: new Date(now.getTime() + Math.random() * 172800000).toISOString() // Next 2 days
            });
        }

        return matches;
    }

    generateSampleStandings() {
        return this.premierLeagueTeams.map((team, index) => ({
            position: index + 1,
            team: { name: team.name },
            points: 60 - (index * 2) + Math.floor(Math.random() * 8),
            playedGames: 20 + Math.floor(Math.random() * 5),
            won: 10 + Math.floor(Math.random() * 8),
            draw: 3 + Math.floor(Math.random() * 5),
            lost: 2 + Math.floor(Math.random() * 7),
            goalsFor: 25 + Math.floor(Math.random() * 20),
            goalsAgainst: 15 + Math.floor(Math.random() * 15)
        }));
    }

    generateSampleScorers() {
        const players = [
            { name: 'Erling Haaland', team: 'Manchester City' },
            { name: 'Mohamed Salah', team: 'Liverpool' },
            { name: 'Cole Palmer', team: 'Chelsea' },
            { name: 'Ollie Watkins', team: 'Aston Villa' },
            { name: 'Alexander Isak', team: 'Newcastle United' },
            { name: 'Bukayo Saka', team: 'Arsenal' },
            { name: 'Ivan Toney', team: 'Brentford' },
            { name: 'Jamie Vardy', team: 'Leicester City' },
            { name: 'Heung-min Son', team: 'Tottenham Hotspur' },
            { name: 'Dominik Szoboszlai', team: 'Liverpool' }
        ];

        return players.map((player, index) => ({
            player: { name: player.name },
            team: { name: player.team },
            goals: Math.max(1, 8 - Math.floor(index/2) + Math.floor(Math.random() * 4))
        }));
    }

    render() {
        this.renderStats();
        this.renderLeaderboard();
        this.renderPlayers();
        this.renderTeamSelector();
        this.renderLiveMatches();
        this.renderUpcomingMatches();
        this.updateLastUpdateTime();
        this.updateGameweekInfo();
    }

    updateGameweekInfo() {
        const gameweekElement = document.getElementById('gameweekInfo');
        if (gameweekElement) {
            if (!this.isSeasonStarted()) {
                gameweekElement.textContent = 'Pre-season';
                gameweekElement.style.background = 'rgba(255, 193, 7, 0.3)';
            } else {
                gameweekElement.textContent = `Gameweek ${this.currentWeek}`;
                gameweekElement.style.background = 'rgba(0, 255, 133, 0.2)';
            }
        }
    }

    renderStats() {
        const liveMatches = this.matches.filter(m => m.status === 'IN_PLAY').length;
        const today = new Date().toDateString();
        const todayMatches = this.matches.filter(m => 
            new Date(m.utcDate).toDateString() === today
        ).length;
        const totalPoints = this.players.reduce((sum, player) => sum + player.score, 0);
        
        document.getElementById('liveMatches').textContent = liveMatches;
        document.getElementById('todayMatches').textContent = todayMatches;
        document.getElementById('totalPoints').textContent = totalPoints;
    }

    renderLeaderboard() {
        const container = document.getElementById('leaderboardContent');
        const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
        
        container.innerHTML = sortedPlayers.map((player, index) => `
            <div class="leaderboard-item">
                <div class="position ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}">${index + 1}</div>
                <div>
                    <strong>${player.name}</strong>
                    <div style="font-size: 0.9rem; color: #666;">${player.teams.length}/5 equipos</div>
                </div>
                <div style="text-align: center;">
                    <strong>${player.score}</strong>
                    <div style="font-size: 0.8rem; color: #666;">puntos</div>
                </div>
                <div style="text-align: center; color: ${player.weeklyPoints >= 0 ? '#00ff85' : '#ff4757'};">
                    ${player.weeklyPoints >= 0 ? '+' : ''}${player.weeklyPoints}
                </div>
            </div>
        `).join('');
    }

    renderPlayers() {
        const container = document.getElementById('playersGrid');
        container.innerHTML = this.players.map(player => `
            <div class="player-card" onclick="fantasyGame.showPlayerDetails(${player.id})">
                <div class="player-header">
                    <div class="player-avatar">${player.avatar}</div>
                    <div class="player-info">
                        <h3>${player.name}</h3>
                        <div class="player-score">${player.score} pts</div>
                    </div>
                </div>
                <div class="teams-selected">
                    <strong>Equipos Seleccionados:</strong>
                    <div class="teams-grid">
                        ${this.renderPlayerTeams(player)}
                    </div>
                </div>
                ${player.achievements.length > 0 ? `
                    <div style="margin-top: 15px;">
                        <strong>Achievements:</strong>
                        <div style="margin-top: 5px;">
                            ${player.achievements.map(achievement => `
                                <span style="background: #00ff85; color: #38003c; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; margin-right: 5px;">
                                    ${achievement}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    renderPlayerTeams(player) {
        const teams = [...player.teams];
        while (teams.length < 5) {
            teams.push(null);
        }
        
        return teams.map(team => `
            <div class="team-badge ${team ? 'selected' : ''}">
                ${team ? this.getTeamAbbreviation(team) : '---'}
            </div>
        `).join('');
    }

    getTeamAbbreviation(teamName) {
        const abbreviations = {
            'Manchester City': 'MCI',
            'Arsenal': 'ARS',
            'Liverpool': 'LIV',
            'Chelsea': 'CHE',
            'Tottenham Hotspur': 'TOT',
            'Manchester United': 'MUN',
            'Newcastle United': 'NEW',
            'Aston Villa': 'AVL',
            'Brighton & Hove Albion': 'BHA',
            'West Ham United': 'WHU',
            'Crystal Palace': 'CRY',
            'Fulham': 'FUL',
            'Wolverhampton Wanderers': 'WOL',
            'Everton': 'EVE',
            'Brentford': 'BRE',
            'Nottingham Forest': 'NFO',
            'AFC Bournemouth': 'BOU',
            'Leeds United': 'LEE',
            'Burnley': 'BUR',
            'Sheffield United': 'SHU'
        };
        return abbreviations[teamName] || teamName.substring(0, 3).toUpperCase();
    }

    renderTeamSelector() {
        const container = document.getElementById('teamsAvailable');
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        document.getElementById('currentPlayerSelect').value = this.currentPlayerIndex;
        document.getElementById('selectedCount').textContent = currentPlayer.teams.length;
        document.getElementById('totalValue').textContent = this.calculateTeamValue(currentPlayer.teams);
        
        container.innerHTML = this.premierLeagueTeams.map(team => {
            const isSelected = currentPlayer.teams.includes(team.name);
            const isSelectedByOther = this.players.some(p => 
                p.id !== currentPlayer.id && p.teams.includes(team.name)
            );
            const canSelect = currentPlayer.teams.length < 5;
            
            return `
                <div class="team-option ${isSelected ? 'selected' : ''} ${isSelectedByOther || (!canSelect && !isSelected) ? 'disabled' : ''}"
                     onclick="fantasyGame.toggleTeam('${team.name}')">
                    <h4>${team.name}</h4>
                    <div class="team-value">€${team.value}M</div>
                    <div class="team-expected">Pos. esperada: ${team.expectedPosition}</div>
                    ${isSelectedByOther ? '<div style="font-size: 0.7rem; color: #ff4757; margin-top: 5px;">Ya seleccionado</div>' : ''}
                </div>
            `;
        }).join('');
    }

    renderLiveMatches() {
        const container = document.getElementById('liveMatches');
        
        // Check if season has started
        if (!this.isSeasonStarted()) {
            const daysUntilStart = this.getDaysUntilSeason();
            
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: rgba(255, 255, 255, 0.1); border-radius: 15px;">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; color: #666; margin-bottom: 15px;"></i>
                    <h3 style="color: #333; margin-bottom: 10px;">Season 2025-26</h3>
                    <p style="color: #666; font-size: 1.1rem;">Premier League starts on <strong>Friday, August 15th 2025</strong></p>
                    <p style="color: #00ff85; font-size: 1.2rem; font-weight: bold; margin: 15px 0;">
                        <i class="fas fa-clock"></i> ${daysUntilStart} days remaining
                    </p>
                    <p style="color: #999; margin-top: 10px;">Live matches will appear here when the season begins</p>
                </div>
            `;
            return;
        }

        const liveMatches = this.matches.filter(m => m.status === 'IN_PLAY');
        
        if (liveMatches.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No live matches at the moment</p>';
            return;
        }

        container.innerHTML = liveMatches.map(match => this.renderMatchCard(match)).join('');
    }

    renderUpcomingMatches() {
        const container = document.getElementById('upcomingMatches');
        
        // Check if season has started
        if (!this.isSeasonStarted()) {
            const daysUntilStart = this.getDaysUntilSeason();
            
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: rgba(255, 255, 255, 0.1); border-radius: 15px;">
                    <i class="fas fa-hourglass-half" style="font-size: 3rem; color: #00ff85; margin-bottom: 15px;"></i>
                    <h3 style="color: #333; margin-bottom: 10px;">Season Starts Soon</h3>
                    <p style="color: #666; font-size: 1.2rem;">
                        <strong>${daysUntilStart} days</strong> until Premier League begins
                    </p>
                    <p style="color: #999; margin-top: 10px;">Friday, August 15th 2025</p>
                    <p style="color: #999; font-size: 0.9rem; margin-top: 5px;">Season 2025-26</p>
                </div>
            `;
            return;
        }

        const upcomingMatches = this.matches.filter(m => m.status === 'SCHEDULED');
        
        if (upcomingMatches.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No upcoming fixtures scheduled</p>';
            return;
        }

        container.innerHTML = upcomingMatches.map(match => this.renderMatchCard(match)).join('');
    }

    renderMatchCard(match) {
        const homeScore = match.score.fullTime.home;
        const awayScore = match.score.fullTime.away;
        const matchDate = new Date(match.utcDate);
        
        let statusHtml = '';
        if (match.status === 'IN_PLAY') {
            statusHtml = `<span class="live-indicator">EN VIVO ${match.minute || ''}'</span>`;
        } else if (match.status === 'FINISHED') {
            statusHtml = '<span class="finished-indicator">FINALIZADO</span>';
        } else {
            statusHtml = `<span class="scheduled-indicator">${matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>`;
        }

        return `
            <div class="match-card">
                <div class="match-header">
                    ${statusHtml}
                </div>
                <div class="match-teams">
                    <div class="team">
                        <div class="team-logo">${match.homeTeam.name.charAt(0)}</div>
                        <span>${match.homeTeam.name}</span>
                    </div>
                    <div class="score">
                        ${homeScore !== null ? `${homeScore} - ${awayScore}` : 'vs'}
                    </div>
                    <div class="team">
                        <span>${match.awayTeam.name}</span>
                        <div class="team-logo">${match.awayTeam.name.charAt(0)}</div>
                    </div>
                </div>
                <div style="text-align: center; font-size: 0.9rem; color: #666; margin-top: 10px;">
                    ${matchDate.toLocaleDateString('es-ES')} • Premier League
                </div>
            </div>
        `;
    }

    // Team Selection Methods
    toggleTeam(teamName) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const teamIndex = currentPlayer.teams.indexOf(teamName);
        
        // Check if team is selected by another player
        const isSelectedByOther = this.players.some(p => 
            p.id !== currentPlayer.id && p.teams.includes(teamName)
        );
        
        if (isSelectedByOther) {
            this.showNotification('Error', 'Este equipo ya ha sido seleccionado por otro jugador', 'error');
            return;
        }
        
        if (teamIndex > -1) {
            // Remove team
            currentPlayer.teams.splice(teamIndex, 1);
        } else {
            // Add team if not at limit
            if (currentPlayer.teams.length < 5) {
                currentPlayer.teams.push(teamName);
            } else {
                this.showNotification('Error', 'Ya has seleccionado 5 equipos. Debes remover uno primero.', 'error');
                return;
            }
        }
        
        this.renderTeamSelector();
        this.saveData();
    }

    switchPlayer(playerIndex) {
        this.currentPlayerIndex = parseInt(playerIndex);
        this.renderTeamSelector();
        this.saveData();
    }

    saveTeamSelection() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.teams.length !== 5) {
            this.showNotification('Error', `${currentPlayer.name} must select exactly 5 teams. Currently has ${currentPlayer.teams.length}.`, 'error');
            return;
        }
        
        this.showNotification('Success', `Selection saved for ${currentPlayer.name}!`, 'success');
        this.renderPlayers();
        this.renderLeaderboard();
        this.saveData();
    }

    clearSelection() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        currentPlayer.teams = [];
        this.renderTeamSelector();
        this.saveData();
        this.showNotification('Info', `Selection cleared for ${currentPlayer.name}`, 'success');
    }

    calculateTeamValue(playerTeams) {
        return playerTeams.reduce((total, teamName) => {
            const team = this.premierLeagueTeams.find(t => t.name === teamName);
            return total + (team ? team.value : 0);
        }, 0);
    }

    // Points Calculation Methods
    calculateLivePoints() {
        this.players.forEach(player => {
            const weeklyPoints = this.calculateWeeklyPoints(player);
            player.weeklyPoints = weeklyPoints;
            player.score += weeklyPoints;
        });
        
        this.render();
        this.saveData();
        this.showNotification('Success', 'Points calculated based on current results', 'success');
    }

    calculateWeeklyPoints(player) {
        let points = 0;
        
        player.teams.forEach(teamName => {
            const team = this.premierLeagueTeams.find(t => t.name === teamName);
            const teamMatches = this.matches.filter(m => 
                (m.homeTeam.name === teamName || m.awayTeam.name === teamName) && 
                m.status === 'FINISHED'
            );
            
            teamMatches.forEach(match => {
                const isHome = match.homeTeam.name === teamName;
                const teamScore = isHome ? match.score.fullTime.home : match.score.fullTime.away;
                const opponentScore = isHome ? match.score.fullTime.away : match.score.fullTime.home;
                
                // Points for win
                if (teamScore > opponentScore) {
                    points += 3;
                }
                
                // Points for goals scored
                points += teamScore;
                
                // Points lost for goals conceded (every 2 goals)
                points -= Math.floor(opponentScore / 2);
                
                // Underdog bonus
                const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;
                const opponentTeam = this.premierLeagueTeams.find(t => t.name === opponent);
                if (teamScore > opponentScore && opponentTeam && opponentTeam.value >= (team.value * 2)) {
                    points += 5;
                    if (!player.achievements.includes('Underdog Victory')) {
                        player.achievements.push('Underdog Victory');
                    }
                }
            });
        });
        
        return points;
    }

    simulateWeeklyUpdate() {
        // Generate random results for all teams
        const weekResults = this.premierLeagueTeams.map(team => ({
            team: team.name,
            result: Math.random() < 0.4 ? 'win' : Math.random() < 0.7 ? 'draw' : 'loss',
            goalsFor: Math.floor(Math.random() * 4),
            goalsAgainst: Math.floor(Math.random() * 3),
            opponentValue: this.premierLeagueTeams[Math.floor(Math.random() * this.premierLeagueTeams.length)].value
        }));
        
        // Update player points
        this.players.forEach(player => {
            const weeklyPoints = this.calculateWeeklyPointsFromResults(player, weekResults);
            player.weeklyPoints = weeklyPoints;
            player.score += weeklyPoints;
            
            // Add random achievements
            if (Math.random() < 0.1) {
                const achievements = ['Top 4', 'League Champion', 'Golden Boot', 'Top Assister'];
                const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];
                if (!player.achievements.includes(randomAchievement)) {
                    player.achievements.push(randomAchievement);
                }
            }
        });
        
        this.currentWeek++;
        this.render();
        this.saveData();
        
        this.showNotification('Gameweek Complete', `Gameweek ${this.currentWeek - 1} simulated! Points updated.`, 'success');
    }

    calculateWeeklyPointsFromResults(player, weekResults) {
        let points = 0;
        
        player.teams.forEach(teamName => {
            const team = this.premierLeagueTeams.find(t => t.name === teamName);
            const result = weekResults.find(r => r.team === teamName);
            
            if (result) {
                // Points for victory
                if (result.result === 'win') points += 3;
                
                // Points for goals scored
                points += result.goalsFor;
                
                // Points lost for goals conceded (every 2 goals)
                points -= Math.floor(result.goalsAgainst / 2);
                
                // Underdog bonus
                if (result.result === 'win' && result.opponentValue >= (team.value * 2)) {
                    points += 5;
                    if (!player.achievements.includes('Underdog Victory')) {
                        player.achievements.push('Underdog Victory');
                    }
                }
            }
        });
        
        return points;
    }

    // Auto Update Methods
    startAutoUpdate() {
        setInterval(() => {
            if (this.autoRefreshEnabled) {
                this.autoUpdate();
            }
        }, this.updateInterval);
    }

    async autoUpdate() {
        try {
            // Simulate live match updates
            this.matches.forEach(match => {
                if (match.status === 'IN_PLAY') {
                    // Random chance for score change
                    if (Math.random() < 0.1) { // 10% chance
                        if (Math.random() < 0.5) {
                            match.score.fullTime.home++;
                        } else {
                            match.score.fullTime.away++;
                        }
                    }
                    
                    // Update minute
                    if (match.minute < 90) {
                        match.minute++;
                    } else if (Math.random() < 0.2) {
                        // 20% chance to finish after 90 minutes
                        match.status = 'FINISHED';
                        delete match.minute;
                    }
                }
            });

            this.renderStats();
            this.renderLiveMatches();
            this.updateLastUpdateTime();
        } catch (error) {
            console.error('Error during auto update:', error);
        }
    }

    async forceUpdate() {
        this.updateConnectionStatus('connecting', 'Updating...');
        try {
            await this.fetchInitialData();
            this.render();
            this.updateConnectionStatus('connected', 'Connected');
            this.showNotification('Success', 'Data updated successfully', 'success');
        } catch (error) {
            this.updateConnectionStatus('error', 'Connection Error');
            this.showNotification('Error', 'Could not update data', 'error');
        }
    }

    // UI Helper Methods
    updateConnectionStatus(status, text) {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.className = `connection-status ${status}`;
        statusElement.innerHTML = `<i class="fas fa-${status === 'connected' ? 'wifi' : status === 'error' ? 'exclamation-triangle' : 'sync'}"></i> ${text}`;
    }

    updateLastUpdateTime() {
        const now = new Date();
        document.getElementById('lastUpdate').textContent = 
            now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
            <div style="font-size: 0.9rem;">${message}</div>
        `;
        
        document.getElementById('notifications').appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    showPlayerDetails(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-user"></i> ${player.name} - Estadísticas Detalladas</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Puntuación Total:</strong> ${player.score} puntos
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Puntos Esta Semana:</strong> 
                    <span style="color: ${player.weeklyPoints >= 0 ? '#00ff85' : '#ff4757'};">
                        ${player.weeklyPoints >= 0 ? '+' : ''}${player.weeklyPoints}
                    </span>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Valor Total de Equipos:</strong> €${this.calculateTeamValue(player.teams)}M
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Selected Teams:</strong>
                    <div style="margin-top: 10px;">
                        ${player.teams.map(team => `
                            <span style="background: #f0f0f0; padding: 5px 10px; border-radius: 15px; margin-right: 5px; display: inline-block; margin-bottom: 5px;">
                                ${team}
                            </span>
                        `).join('')}
                    </div>
                </div>
                ${player.achievements.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <strong>Achievements Earned:</strong>
                        <div style="margin-top: 10px;">
                            ${player.achievements.map(achievement => `
                                <span style="background: #00ff85; color: #38003c; padding: 5px 10px; border-radius: 15px; margin-right: 5px; display: inline-block; margin-bottom: 5px;">
                                    <i class="fas fa-trophy"></i> ${achievement}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('modalContainer').appendChild(modal);
    }

    // Data Persistence
    saveData() {
        const data = {
            players: this.players,
            currentPlayerIndex: this.currentPlayerIndex,
            currentWeek: this.currentWeek,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('fantasyPremierLeague', JSON.stringify(data));
    }

    loadData() {
        try {
            const saved = localStorage.getItem('fantasyPremierLeague');
            if (saved) {
                const data = JSON.parse(saved);
                this.players = data.players || this.players;
                this.currentPlayerIndex = data.currentPlayerIndex || 0;
                this.currentWeek = data.currentWeek || 1;
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }

    // Export/Import functionality
    exportData() {
        const data = {
            players: this.players,
            currentWeek: this.currentWeek,
            season: this.currentSeason,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fantasy-pl-${this.currentSeason}-week-${this.currentWeek}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Success', 'Data exported successfully', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.players = data.players;
                        this.currentWeek = data.currentWeek || 1;
                        this.currentSeason = data.season || this.currentSeason;
                        
                        this.render();
                        this.saveData();
                        this.showNotification('Success', 'Data imported successfully', 'success');
                    } catch (error) {
                        this.showNotification('Error', 'Error importing data. Please verify the file is valid.', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
}

// Global instance
let fantasyGame;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fantasyGame = new FantasyPremierLeague();
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);