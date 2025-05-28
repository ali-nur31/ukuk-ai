import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserRole,
    deleteUser,
    getVipUsers,
    getBlockedUsers,
    getUsersByRole,
    updateVipStatus,
    getAllPendingLoans,
    approveBulkLoans,
    createLoan,
    searchUsers,
    blockUserTemporary,
    blockUserPermanent,
    unblockUser,
    blockUser,
    getUsersByStatus,
    updateUserStatus,
    approveLoan
} from '../api';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Grid,
    Card,
    CardContent,
    Alert,
    Snackbar,
    CircularProgress,
    Checkbox,
    FormControlLabel,
    Divider,
    Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import MoneyIcon from '@mui/icons-material/Money';
import SaveIcon from '@mui/icons-material/Save';

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [openUserDialog, setOpenUserDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [userForm, setUserForm] = useState({
        username: '',
        email: '',
        password: '',
        role: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, vip, blocked
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    
    // Loans state
    const [pendingLoans, setPendingLoans] = useState([]);
    const [loansToApprove, setLoansToApprove] = useState({});
    const [loansSaving, setLoansSaving] = useState(false);

    // Block state
    const [openBlockDialog, setOpenBlockDialog] = useState(false);
    const [blockType, setBlockType] = useState('temporary'); // 'temporary' or 'permanent'
    const [userToBlock, setUserToBlock] = useState(null);
    const [blockDays, setBlockDays] = useState(7);
    const [blockReason, setBlockReason] = useState('');

    useEffect(() => {
        fetchData();
        fetchPendingLoans();
        // Get current user ID from localStorage or context
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setCurrentUserId(parsedUser.id);
            } catch (err) {
                console.error('Error parsing user data:', err);
            }
        }
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            let usersData = [];
            
            switch (filter) {
                case 'vip':
                    usersData = await getUsersByStatus('vip');
                    break;
                case 'blocked':
                    usersData = await getUsersByStatus('blocked');
                    break;
                default:
                    if (searchTerm && searchResults.length > 0) {
                        setLoading(false);
                        return;
                    }
                    usersData = await getAllUsers();
            }

            if (usersData && Array.isArray(usersData)) {
                const processedUsers = usersData.map(user => ({
                    id: user.id,
                    username: user.username,
                    email: user.email || '',
                    role: user.role || 'USER',
                    isVip: user.status === 'vip',
                    isBlocked: user.status === 'blocked',
                    balance: user.balance || 0,
                    blockExpiryDate: user.blockExpiryDate || null,
                    blockReason: user.blockReason || ''
                }));
                setUsers(processedUsers);
            } else {
                setUsers([]);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Failed to fetch data');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchPendingLoans = async () => {
        try {
            setLoading(true);
            const loansData = await getAllPendingLoans();
            console.log('Pending loans data:', loansData);
            setPendingLoans(Array.isArray(loansData) ? loansData : []);
        } catch (err) {
            console.error('Error fetching pending loans:', err);
            setError(err.message || 'Failed to fetch pending loans');
        } finally {
            setLoading(false);
        }
    };

    // Create a test loan
    const handleCreateTestLoan = async () => {
        try {
            // Get first user from the list or use a default ID
            const userId = users.length > 0 ? users[0].id : 1;
            
            const loanData = {
                amount: 1000,
                interestRate: 10.5,
                userId: userId,
                termInMonths: 12
            };
            
            await createLoan(loanData);
            setSuccess('Тестовый кредит успешно создан!');
            fetchPendingLoans(); // Refresh the loans list
        } catch (err) {
            console.error('Error creating test loan:', err);
            setError(err.message || 'Failed to create test loan');
        }
    };

    const handleUserDialogOpen = (user = null) => {
        if (user) {
            setUserForm({
                username: user.username,
                email: user.email,
                password: '',
                role: user.role?.name || ''
            });
            setSelectedUser(user);
        } else {
            setUserForm({
                username: '',
                email: '',
                password: '',
                role: ''
            });
            setSelectedUser(null);
        }
        setOpenUserDialog(true);
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedUser) {
                await updateUser(selectedUser.id, userForm);
                setSuccess('Пользователь успешно обновлен');
            } else {
                await createUser(userForm);
                setSuccess('Пользователь успешно создан');
            }
            setOpenUserDialog(false);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        // Проверка на удаление самого себя
        if (userId === currentUserId) {
            setError('Вы не можете удалить собственный аккаунт');
            return;
        }

        // Находим пользователя для подтверждения
        const userToDelete = users.find(user => user.id === userId);
        if (!userToDelete) {
            setError('Пользователь не найден');
            return;
        }

        setUserToDelete(userToDelete);
        setOpenDeleteDialog(true);
    };

    const handleUpdateVipStatus = async (userId, isVip) => {
        try {
            await updateUserStatus(userId, isVip ? 'vip' : 'user');
            await fetchData();
            setSuccess(`User ${isVip ? 'promoted to' : 'removed from'} VIP status`);
        } catch (err) {
            setError(err.message || 'Failed to update VIP status');
        }
    };

    const handleUpdateUserRole = async (userId, roleName) => {
        try {
            await updateUserRole(userId, roleName);
            setSuccess('Роль пользователя успешно обновлена');
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        const term = e.target.value;
        setSearchTerm(term);
        
        if (term.trim() === '') {
            // If search is cleared, revert to all users
            setSearchResults([]);
            fetchData();
            return;
        }
        
        try {
            setIsSearching(true);
            setLoading(true);
            const results = await searchUsers(term);
            
            // Process search results
            if (results && Array.isArray(results)) {
                const processedUsers = results.map(user => ({
                    id: user.id,
                    username: user.username,
                    email: user.email || '',
                    role: {
                        name: user.roleName || 'USER'
                    },
                    isVip: user.isVip || false,
                    isBlocked: user.isBlocked || false,
                    balance: user.balance || 0,
                    blockExpiryDate: user.blockExpiryDate || null,
                    blockReason: user.blockReason || ''
                }));
                setSearchResults(processedUsers);
                setUsers(processedUsers);
            } else {
                setSearchResults([]);
                setUsers([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setError('Ошибка поиска: ' + error.message);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch(e);
        }
    };
    
    // Handle loan approval change
    const handleLoanApprovalChange = async (loanId, isApproved) => {
        try {
            await approveLoan(loanId, isApproved);
            await fetchPendingLoans();
            setSuccess(`Loan ${isApproved ? 'approved' : 'rejected'} successfully`);
        } catch (err) {
            setError(err.message || 'Failed to update loan status');
        }
    };
    
    // Save loan approvals
    const handleSaveApprovals = async () => {
        try {
            setLoansSaving(true);
            const loanIdsToApprove = Object.entries(loansToApprove)
                .filter(([_, isApproved]) => isApproved)
                .map(([loanId, _]) => parseInt(loanId));
                
            if (loanIdsToApprove.length === 0) {
                setError('Не выбрано ни одного кредита для одобрения');
                setLoansSaving(false);
                return;
            }
            
            await approveBulkLoans(loanIdsToApprove);
            setSuccess('Выбранные кредиты успешно обработаны');
            setLoansToApprove({});
            fetchPendingLoans(); // Refresh loans list
        } catch (err) {
            setError(err.message || 'Ошибка при сохранении одобрений кредитов');
        } finally {
            setLoansSaving(false);
        }
    };

    const handleUpdateBlockStatus = (user) => {
        if (user.isBlocked) {
            handleUnblockUser(user.id);
        } else {
            setUserToBlock(user);
            setBlockType('temporary');
            setBlockDays(7);
            setBlockReason('');
            setOpenBlockDialog(true);
        }
    };

    const handleBlockUser = async () => {
        try {
            await blockUser(userToBlock.id, {
                type: blockType,
                duration: blockType === 'temporary' ? blockDays : null,
                reason: blockReason
            });
            await fetchData();
            setOpenBlockDialog(false);
            setSuccess('User blocked successfully');
        } catch (err) {
            setError(err.message || 'Failed to block user');
        }
    };
    
    const handleUnblockUser = async (userId) => {
        try {
            await unblockUser(userId);
            await fetchData();
            setSuccess('User unblocked successfully');
        } catch (err) {
            setError(err.message || 'Failed to unblock user');
        }
    };

    const filteredUsers = searchTerm && searchResults.length > 0 
        ? searchResults 
        : Array.isArray(users) 
            ? users
            : [];

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Панель администратора
            </Typography>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Управление пользователями
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Поиск пользователей"
                                        variant="outlined"
                                        size="small"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        onKeyPress={handleKeyPress}
                                        sx={{ mr: 1 }}
                                        InputProps={{
                                            endAdornment: isSearching ? (
                                                <CircularProgress size={20} />
                                            ) : (
                                                <SearchIcon color="action" />
                                            )
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={() => setSearchTerm('')}
                                        disabled={!searchTerm}
                                        size="small"
                                    >
                                        Сбросить
                                    </Button>
                                </Box>
                                {searchTerm && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Найдено пользователей: {searchResults.length}
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleUserDialogOpen()}
                                        color="primary"
                                    >
                                        Добавить пользователя
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Button
                                        variant={filter === 'all' ? 'contained' : 'outlined'}
                                        onClick={() => {
                                            setFilter('all');
                                            setSearchTerm('');
                                            setSearchResults([]);
                                        }}
                                        startIcon={<PersonIcon />}
                                        size="small"
                                    >
                                        Все пользователи
                                    </Button>
                                    {/*<Button*/}
                                    {/*    variant={filter === 'vip' ? 'contained' : 'outlined'}*/}
                                    {/*    onClick={() => {*/}
                                    {/*        setFilter('vip');*/}
                                    {/*        setSearchTerm('');*/}
                                    {/*        setSearchResults([]);*/}
                                    {/*    }}*/}
                                    {/*    startIcon={<StarIcon />}*/}
                                    {/*    size="small"*/}
                                    {/*>*/}
                                    {/*    VIP*/}
                                    {/*</Button>*/}
                                    <Button
                                        variant={filter === 'blocked' ? 'contained' : 'outlined'}
                                        onClick={() => {
                                            setFilter('blocked');
                                            setSearchTerm('');
                                            setSearchResults([]);
                                        }}
                                        startIcon={<BlockIcon />}
                                        size="small"
                                    >
                                        Заблокированные
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Другие разделы администрирования
                            </Typography>
                            <Button
                                component={Link}
                                to="/admin/news"
                                variant="contained"
                                startIcon={<NewspaperIcon />}
                                sx={{ mr: 1 }}
                            >
                                Управление новостями
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            
            {/* Loan Approval Section */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                Одобрение кредитов
            </Typography>
            
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Заявки на кредиты</Typography>
                        <Box>
                            {/* <Button 
                                variant="outlined" 
                                color="primary" 
                                onClick={handleCreateTestLoan}
                                sx={{ mr: 2 }}
                                startIcon={<AddIcon />}
                            >
                                Создать тестовый кредит
                            </Button> */}
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={handleSaveApprovals}
                                disabled={Object.keys(loansToApprove).length === 0 || loansSaving}
                                startIcon={<SaveIcon />}
                            >
                                Сохранить изменения
                            </Button>
                        </Box>
                    </Box>
                    
                    {/* Debug info section */}
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>Отладочная информация:</Typography>
                        <Typography variant="body2">
                            Количество кредитов: {pendingLoans.length}
                        </Typography>
                    </Box>
                    
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Пользователь</TableCell>
                                    <TableCell>Сумма</TableCell>
                                    <TableCell>Ставка</TableCell>
                                    <TableCell>Срок (мес)</TableCell>
                                    <TableCell>Ежемесячный платеж</TableCell>
                                    <TableCell>Дата заявки</TableCell>
                                    <TableCell>Статус</TableCell>
                                    <TableCell>Одобрить</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pendingLoans.length > 0 ? (
                                    pendingLoans.map((loan) => (
                                        <TableRow key={loan.id}>
                                            <TableCell>{loan.id}</TableCell>
                                            <TableCell>{loan.username || 'Н/Д'}</TableCell>
                                            <TableCell>{loan.amount}</TableCell>
                                            <TableCell>{loan.interestRate}%</TableCell>
                                            <TableCell>{loan.termInMonths}</TableCell>
                                            <TableCell>{loan.monthlyPayment}</TableCell>
                                            <TableCell>
                                                {loan.startDate ? new Date(loan.startDate).toLocaleDateString() : 'Н/Д'}
                                            </TableCell>
                                            <TableCell>{loan.status}</TableCell>
                                            <TableCell>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox 
                                                            checked={!!loansToApprove[loan.id]} 
                                                            onChange={(e) => handleLoanApprovalChange(loan.id, e.target.checked)}
                                                        />
                                                    }
                                                    label="Одобрить"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center">
                                            Нет заявок на кредиты
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" gutterBottom>
                Управление пользователями
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Имя пользователя</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Роль</TableCell>
                            <TableCell>Баланс</TableCell>
                            <TableCell>Статус</TableCell>
                            <TableCell>Детали блокировки</TableCell>
                            <TableCell>Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.email || 'Н/Д'}</TableCell>
                                <TableCell>{user.role?.name || 'Н/Д'}</TableCell>
                                <TableCell>{user.balance}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {/*<Tooltip title={user.isVip ? "Убрать VIP" : "Сделать VIP"}>*/}
                                        {/*    <IconButton*/}
                                        {/*        onClick={() => handleUpdateVipStatus(user.id, !user.isVip)}*/}
                                        {/*        color={user.isVip ? "warning" : "default"}*/}
                                        {/*    >*/}
                                        {/*        <StarIcon />*/}
                                        {/*    </IconButton>*/}
                                        {/*</Tooltip>*/}
                                        <Tooltip title={user.isBlocked ? "Разблокировать" : "Заблокировать"}>
                                            <IconButton
                                                onClick={() => handleUpdateBlockStatus(user)}
                                                color={user.isBlocked ? "error" : "default"}
                                            >
                                                <BlockIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {user.isBlocked && (
                                        <Box>
                                            <Typography variant="body2">
                                                {user.blockReason || 'Причина не указана'}
                                            </Typography>
                                            {user.blockExpiryDate && (
                                                <Typography variant="caption" color="text.secondary">
                                                    До: {new Date(user.blockExpiryDate).toLocaleDateString()}
                                                </Typography>
                                            )}
                                            {!user.blockExpiryDate && (
                                                <Typography variant="caption" color="error">
                                                    Постоянная блокировка
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {/*<Tooltip title="Редактировать">*/}
                                        {/*    <IconButton onClick={() => handleUserDialogOpen(user)}>*/}
                                        {/*        <EditIcon />*/}
                                        {/*    </IconButton>*/}
                                        {/*</Tooltip>*/}
                                        <Tooltip title="Удалить">
                                            <IconButton onClick={() => handleDeleteUser(user.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    Пользователи не найдены
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* User Dialog */}
            <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)}>
                <DialogTitle>
                    {selectedUser ? 'Редактировать пользователя' : 'Добавить нового пользователя'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleUserSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Имя пользователя"
                            value={userForm.username}
                            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Пароль"
                            type="password"
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUserDialog(false)}>Отмена</Button>
                    <Button onClick={handleUserSubmit} variant="contained">
                        {selectedUser ? 'Обновить' : 'Создать'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
            >
                <DialogTitle>Подтверждение удаления</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить пользователя <strong>{userToDelete?.username}</strong>?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                        Это действие нельзя отменить. Все данные пользователя будут безвозвратно удалены.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenDeleteDialog(false)}
                        disabled={loading}
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={confirmDeleteUser}
                        variant="contained"
                        color="error"
                        disabled={loading || !userToDelete}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Удаление...' : 'Удалить'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* User Block Dialog */}
            <Dialog open={openBlockDialog} onClose={() => setOpenBlockDialog(false)}>
                <DialogTitle>
                    Блокировка пользователя {userToBlock?.username}
                </DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                        <InputLabel>Тип блокировки</InputLabel>
                        <Select
                            value={blockType}
                            onChange={(e) => setBlockType(e.target.value)}
                            label="Тип блокировки"
                        >
                            <MenuItem value="temporary">Временная</MenuItem>
                            <MenuItem value="permanent">Постоянная</MenuItem>
                        </Select>
                    </FormControl>
                    
                    {blockType === 'temporary' && (
                        <TextField
                            fullWidth
                            label="Количество дней"
                            type="number"
                            value={blockDays}
                            onChange={(e) => setBlockDays(e.target.value)}
                            InputProps={{ inputProps: { min: 1, max: 365 } }}
                            sx={{ mb: 2 }}
                        />
                    )}
                    
                    <TextField
                        fullWidth
                        label="Причина блокировки"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        multiline
                        rows={3}
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBlockDialog(false)}>Отмена</Button>
                    <Button onClick={handleBlockUser} variant="contained" color="error">
                        Заблокировать
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
            >
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Admin;